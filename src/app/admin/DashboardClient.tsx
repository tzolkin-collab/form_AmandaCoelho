"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { diagnosticData } from "@/data/diagnosticData";

type ResponseRow = {
  id: string;
  idempotency_key: string;
  profile_name: string;
  answers: Record<string, string>;
  created_at: string;
  updated_at?: string | null;
  completed_at?: string | null;
};

type HourBucket = {
  hour: string;
  total: number;
  complete: number;
  partial: number;
};

const TOTAL_QUESTIONS = diagnosticData.questions.length;
const questionMap = Object.fromEntries(diagnosticData.questions.map((q) => [q.id.toString(), q.text]));

function getAnsweredCount(answers: Record<string, string>) {
  return Object.values(answers).filter((value) => typeof value === "string" && value.trim().length > 0).length;
}

function isCompleteLead(row: ResponseRow) {
  return getAnsweredCount(row.answers) >= TOTAL_QUESTIONS;
}

function getLeadTimestamp(row: ResponseRow) {
  return row.completed_at ?? row.updated_at ?? row.created_at;
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getHourNumber(value?: string | null) {
  if (!value) return 0;

  return Number(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date(value))
  );
}

export default function DashboardClient() {
  const [data, setData] = useState<ResponseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/data")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((json) => {
        setData(json.data || []);
        setLoading(false);
      })
      .catch(() => {
        router.push("/admin/login");
      });
  }, [router]);

  const analytics = useMemo(() => {
    const hourlyBuckets: HourBucket[] = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${String(hour).padStart(2, "0")}h`,
      total: 0,
      complete: 0,
      partial: 0,
    }));

    const profileMap = new Map<string, number>();
    let completeLeads = 0;
    let partialLeads = 0;

    for (const row of data) {
      const complete = isCompleteLead(row);
      const timestamp = getLeadTimestamp(row);
      const hour = getHourNumber(timestamp);
      const bucket = hourlyBuckets[hour];

      if (bucket) {
        bucket.total += 1;
        if (complete) {
          bucket.complete += 1;
        } else {
          bucket.partial += 1;
        }
      }

      if (complete) {
        completeLeads += 1;
      } else {
        partialLeads += 1;
      }

      profileMap.set(row.profile_name, (profileMap.get(row.profile_name) ?? 0) + 1);
    }

    const totalLeads = data.length;
    const completionRate = totalLeads ? Math.round((completeLeads / totalLeads) * 100) : 0;
    const maxBucketValue = Math.max(...hourlyBuckets.map((bucket) => bucket.total), 1);
    const peakBucket = hourlyBuckets.reduce((current, bucket) => {
      if (bucket.total > current.total) return bucket;
      return current;
    }, hourlyBuckets[0]);

    const profileDistribution = Array.from(profileMap.entries())
      .map(([profile, count]) => ({
        profile,
        count,
        percentage: totalLeads ? Math.round((count / totalLeads) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalLeads,
      completeLeads,
      partialLeads,
      completionRate,
      maxBucketValue,
      peakBucket,
      profileDistribution,
      hourlyBuckets,
      lastLeadAt: data[0] ? getLeadTimestamp(data[0]) : null,
    };
  }, [data]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <div className="dashboard-layout">
      <nav className="top-nav">
        <div className="nav-container">
          <div className="brand">
            <Image src="/assets/logo.png" alt="Logo" width={28} height={28} className="vercel-logo" />
            <span className="brand-divider">/</span>
            <span className="brand-name">Diagnostic Dashboard</span>
          </div>
          <div className="nav-actions">
            <button onClick={handleLogout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div className="header-section">
          <div>
            <h1>Fluxo de leads</h1>
            <p>KPIs do diagnóstico, evolução de preenchimentos e horários exibidos em Brasília.</p>
          </div>
          <div className="header-meta">
            <span>Último registro</span>
            <strong>{formatDateTime(analytics.lastLeadAt)}</strong>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Carregando dados...</div>
        ) : data.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhum resultado ainda</h3>
            <p>Os dados aparecerão aqui quando as pessoas começarem a preencher o diagnóstico.</p>
          </div>
        ) : (
          <>
            <section className="kpi-grid">
              <article className="kpi-card">
                <span className="kpi-label">Total de leads</span>
                <strong className="kpi-value">{analytics.totalLeads}</strong>
                <p className="kpi-note">Todos os registros com progresso salvo.</p>
              </article>

              <article className="kpi-card">
                <span className="kpi-label">Leads completos</span>
                <strong className="kpi-value">{analytics.completeLeads}</strong>
                <p className="kpi-note">Responderam todas as {TOTAL_QUESTIONS} perguntas.</p>
              </article>

              <article className="kpi-card">
                <span className="kpi-label">Leads parciais</span>
                <strong className="kpi-value">{analytics.partialLeads}</strong>
                <p className="kpi-note">Pararam antes de concluir o fluxo.</p>
              </article>

              <article className="kpi-card">
                <span className="kpi-label">Taxa de conclusão</span>
                <strong className="kpi-value">{analytics.completionRate}%</strong>
                <p className="kpi-note">Baseada no total de leads capturados.</p>
              </article>
            </section>

            <section className="analytics-grid">
              <article className="panel panel-chart">
                <div className="panel-header">
                  <div>
                    <span className="panel-eyebrow">Preenchimentos ao longo do dia</span>
                    <h2>Volume por hora</h2>
                  </div>
                  <div className="panel-highlight">
                    <span>Pico</span>
                    <strong>{analytics.peakBucket.hour}</strong>
                  </div>
                </div>

                <div className="chart-legend">
                  <span><i className="legend-dot legend-complete" />Completos</span>
                  <span><i className="legend-dot legend-partial" />Parciais</span>
                </div>

                <div className="chart-shell">
                  {analytics.hourlyBuckets.map((bucket) => {
                    const totalHeight = Math.max((bucket.total / analytics.maxBucketValue) * 100, bucket.total > 0 ? 10 : 4);
                    const completeRatio = bucket.total ? (bucket.complete / bucket.total) * 100 : 0;
                    const partialRatio = bucket.total ? (bucket.partial / bucket.total) * 100 : 0;

                    return (
                      <div key={bucket.hour} className="bar-column">
                        <span className="bar-value">{bucket.total}</span>
                        <div className="bar-track">
                          <div className="bar-stack" style={{ height: `${totalHeight}%` }}>
                            <div className="bar-segment bar-partial" style={{ height: `${partialRatio}%` }} />
                            <div className="bar-segment bar-complete" style={{ height: `${completeRatio}%` }} />
                          </div>
                        </div>
                        <span className="bar-label">{bucket.hour}</span>
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="panel panel-profiles">
                <div className="panel-header">
                  <div>
                    <span className="panel-eyebrow">Distribuição</span>
                    <h2>Perfis mais frequentes</h2>
                  </div>
                </div>

                <div className="profile-list">
                  {analytics.profileDistribution.map((item) => (
                    <div key={item.profile} className="profile-row">
                      <div>
                        <strong>{item.profile}</strong>
                        <span>{item.percentage}% dos leads</span>
                      </div>
                      <b>{item.count}</b>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="table-container">
              <div className="table-header">
                <div>
                  <span className="panel-eyebrow">Base detalhada</span>
                  <h2>Leads capturados</h2>
                </div>
              </div>

              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Horário Brasília</th>
                      <th>Nome / Contato</th>
                      <th>Status</th>
                      <th>Perfil</th>
                      <th>Respostas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row) => {
                      const answeredCount = getAnsweredCount(row.answers);
                      const complete = answeredCount >= TOTAL_QUESTIONS;
                      const name = row.answers["1"] || "Sem Nome";
                      const phone = row.answers["2"] || "Sem Telefone";
                      const timestamp = getLeadTimestamp(row);
                      const timestampLabel = row.completed_at ? "Concluído em" : "Última interação";

                      return (
                        <tr key={row.id}>
                          <td className="cell-date">
                            <span>{timestampLabel}</span>
                            <strong>{formatDateTime(timestamp)}</strong>
                          </td>
                          <td>
                            <div className="cell-contact">
                              <span className="contact-name">{name}</span>
                              <span className="contact-phone">{phone}</span>
                            </div>
                          </td>
                          <td>
                            <div className="cell-status-profile">
                              <span className={`badge ${complete ? "badge-success" : "badge-partial"}`}>
                                {complete ? "Completo" : `Parcial (${answeredCount}/${TOTAL_QUESTIONS})`}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="badge-profile">{row.profile_name}</span>
                          </td>
                          <td>
                            <details className="cell-details">
                              <summary>Ver respostas ({answeredCount})</summary>
                              <div className="details-content">
                                {Object.entries(row.answers).map(([qId, ans]) => {
                                  if (!ans || ans.trim() === "") return null;

                                  return (
                                    <div key={qId} className="answer-item">
                                      <strong className="question-text">{questionMap[qId] || `Pergunta ${qId}`}</strong>
                                      <p className="answer-text">{ans}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </details>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>

      <style jsx>{`
        .dashboard-layout {
          min-height: 100vh;
          background:
            radial-gradient(circle at top, rgba(244, 244, 245, 0.95), rgba(250, 250, 250, 1) 48%),
            #fafafa;
          color: #111111;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        .top-nav {
          background: rgba(255, 255, 255, 0.86);
          border-bottom: 1px solid #eaeaea;
          position: sticky;
          top: 0;
          z-index: 10;
          backdrop-filter: blur(18px);
        }

        .nav-container {
          max-width: 1280px;
          margin: 0 auto;
          min-height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          gap: 16px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .vercel-logo {
          height: 28px;
          object-fit: contain;
        }

        .brand-divider {
          color: #e0e0e0;
          font-size: 24px;
          font-weight: 200;
        }

        .brand-name {
          font-size: 14px;
          font-weight: 600;
          color: #111111;
        }

        .btn-secondary {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          padding: 8px 14px;
          font-size: 14px;
          font-weight: 500;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          color: #111111;
          border-color: #111111;
        }

        .main-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 40px 24px 56px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .header-section {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
        }

        .header-section h1 {
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 700;
          letter-spacing: -0.05em;
          color: #111111;
          margin: 0 0 8px;
        }

        .header-section p {
          font-size: 15px;
          color: #6b7280;
          margin: 0;
          max-width: 680px;
        }

        .header-meta {
          min-width: 220px;
          padding: 14px 16px;
          border: 1px solid rgba(17, 17, 17, 0.08);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0 18px 50px rgba(17, 17, 17, 0.04);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .header-meta span,
        .kpi-label,
        .panel-eyebrow,
        .cell-date span,
        .profile-row span,
        .kpi-note,
        .bar-label,
        .bar-value,
        th,
        .question-text {
          color: #6b7280;
        }

        .header-meta span,
        .kpi-label,
        .panel-eyebrow,
        .cell-date span,
        .question-text {
          font-size: 12px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          font-weight: 600;
        }

        .header-meta strong,
        .kpi-value,
        .profile-row b,
        .cell-date strong {
          color: #111111;
        }

        .loading-state,
        .empty-state,
        .panel,
        .kpi-card,
        .table-container {
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(17, 17, 17, 0.08);
          border-radius: 24px;
          box-shadow: 0 24px 60px rgba(17, 17, 17, 0.05);
        }

        .loading-state,
        .empty-state {
          padding: 72px 32px;
          text-align: center;
          color: #6b7280;
        }

        .empty-state h3 {
          font-size: 20px;
          font-weight: 600;
          color: #111111;
          margin: 0 0 8px;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .kpi-card {
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .kpi-value {
          font-size: clamp(2rem, 3vw, 2.75rem);
          letter-spacing: -0.05em;
          line-height: 1;
        }

        .kpi-note {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.6fr) minmax(320px, 0.9fr);
          gap: 16px;
        }

        .panel {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .panel-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .panel-header h2,
        .table-header h2 {
          margin: 6px 0 0;
          font-size: 24px;
          letter-spacing: -0.04em;
        }

        .panel-highlight {
          min-width: 104px;
          padding: 12px 14px;
          border-radius: 16px;
          border: 1px solid rgba(17, 17, 17, 0.08);
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .panel-highlight span {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          color: #6b7280;
        }

        .panel-highlight strong {
          font-size: 22px;
          letter-spacing: -0.04em;
        }

        .chart-legend {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
          font-size: 13px;
          color: #4b5563;
        }

        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          display: inline-block;
          margin-right: 8px;
        }

        .legend-complete {
          background: linear-gradient(180deg, #111111 0%, #4b5563 100%);
        }

        .legend-partial {
          background: linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%);
        }

        .chart-shell {
          display: grid;
          grid-template-columns: repeat(24, minmax(18px, 1fr));
          gap: 10px;
          align-items: end;
          min-height: 260px;
        }

        .bar-column {
          min-width: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
        }

        .bar-track {
          height: 190px;
          width: 100%;
          border-radius: 999px;
          background: linear-gradient(180deg, rgba(241, 245, 249, 0.45) 0%, rgba(226, 232, 240, 0.9) 100%);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 6px;
        }

        .bar-stack {
          width: 100%;
          min-height: 4px;
          border-radius: 999px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          background: rgba(255, 255, 255, 0.72);
        }

        .bar-segment {
          width: 100%;
        }

        .bar-complete {
          background: linear-gradient(180deg, #111111 0%, #4b5563 100%);
        }

        .bar-partial {
          background: linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%);
        }

        .bar-value {
          font-size: 11px;
          font-weight: 600;
        }

        .bar-label {
          font-size: 11px;
          font-weight: 600;
        }

        .profile-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .profile-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 16px;
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid rgba(148, 163, 184, 0.18);
        }

        .profile-row strong {
          display: block;
          margin-bottom: 4px;
        }

        .profile-row span {
          display: block;
          font-size: 13px;
        }

        .profile-row b {
          font-size: 24px;
          letter-spacing: -0.04em;
        }

        .table-container {
          overflow: hidden;
        }

        .table-header {
          padding: 24px 24px 0;
        }

        .table-scroll {
          overflow-x: auto;
          padding: 20px 0 0;
        }

        table {
          width: 100%;
          min-width: 960px;
          border-collapse: collapse;
          text-align: left;
        }

        th {
          background: rgba(249, 250, 251, 0.92);
          padding: 14px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        td {
          padding: 18px 24px;
          border-bottom: 1px solid #eef2f7;
          font-size: 14px;
          color: #111111;
          vertical-align: top;
        }

        tr:last-child td {
          border-bottom: none;
        }

        .cell-date {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 168px;
        }

        .cell-date strong {
          font-size: 14px;
          font-weight: 600;
        }

        .cell-contact {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .contact-name {
          font-weight: 600;
        }

        .contact-phone {
          color: #6b7280;
          font-size: 13px;
        }

        .cell-status-profile {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-start;
        }

        .badge,
        .badge-profile,
        .cell-details summary {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
        }

        .badge-success {
          background: #eef2ff;
          color: #3730a3;
          border: 1px solid #c7d2fe;
        }

        .badge-partial {
          background: #f8fafc;
          color: #475569;
          border: 1px solid #cbd5e1;
        }

        .badge-profile {
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          color: #374151;
        }

        .cell-details summary {
          cursor: pointer;
          color: #111111;
          user-select: none;
          outline: none;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          transition: all 0.2s ease;
        }

        .cell-details summary:hover {
          border-color: #111111;
        }

        .details-content {
          margin-top: 14px;
          padding: 16px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          font-size: 13px;
          color: #374151;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 520px;
        }

        .answer-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .answer-text {
          color: #111111;
          font-size: 14px;
          margin: 0;
          line-height: 1.55;
        }

        @media (max-width: 1080px) {
          .kpi-grid,
          .analytics-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 860px) {
          .main-content {
            padding: 32px 16px 40px;
          }

          .nav-container,
          .header-section {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-meta,
          .panel-highlight {
            min-width: 0;
            width: 100%;
          }

          .kpi-grid,
          .analytics-grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .panel,
          .kpi-card,
          .table-container {
            border-radius: 20px;
          }
        }

        @media (max-width: 640px) {
          .chart-shell {
            gap: 6px;
            min-height: 220px;
          }

          .bar-track {
            height: 160px;
            padding: 4px;
          }

          .panel,
          .kpi-card {
            padding: 18px;
          }

          .table-header {
            padding: 18px 18px 0;
          }
        }
      `}</style>
    </div>
  );
}
