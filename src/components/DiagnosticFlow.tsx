"use client";

import type { CSSProperties, TouchEvent, WheelEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { diagnosticData } from "@/data/diagnosticData";
import FluidGlass from "@/components/FluidGlass";
import { saveLeadProgress } from "@/lib/server";

type Question = (typeof diagnosticData.questions)[number];
type Profile = (typeof diagnosticData.profiles)[number];
type Mode = "lens" | "bar" | "cube";
type AnswerMap = Record<number, string>;

type IntroStep = {
  id: string;
  kind: "intro";
  title: string;
  description: string;
  eyebrow: string;
  accent: string;
  mode: Mode;
};

type QuestionStep = {
  id: string;
  kind: "question";
  question: Question;
  mode: Mode;
  accent: string;
};

type ResultStep = {
  id: string;
  kind: "result";
  title: string;
  description: string;
  eyebrow: string;
  accent: string;
  mode: Mode;
  highlight?: string;
  bullets?: string[];
};

type EndStep = {
  id: string;
  kind: "end";
  title: string;
  description: string;
  eyebrow: string;
  accent: string;
  mode: Mode;
};

type FlowStep = IntroStep | QuestionStep | ResultStep | EndStep;

const modeSequence: Mode[] = ["lens", "cube", "bar"];
const accentSequence = [
  "Condução com intenção",
  "Clareza que vende",
  "Relação que fecha",
  "Método que sustenta",
  "Diagnóstico de presença",
  "Elegância comercial",
];

const shellStyle: CSSProperties = {
  position: "relative",
  minHeight: "100svh",
  height: "100svh",
  overflow: "hidden",
  color: "#fff4ec",
  background:
    "radial-gradient(circle at top, rgba(246, 185, 142, 0.14), transparent 32%), radial-gradient(circle at bottom, rgba(60, 12, 18, 0.72), transparent 42%), #140407",
};

const overlayStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(20, 4, 7, 0.08) 0%, rgba(20, 4, 7, 0.24) 36%, rgba(20, 4, 7, 0.56) 100%)",
  pointerEvents: "none",
};

const frameStyle: CSSProperties = {
  position: "relative",
  zIndex: 2,
  minHeight: "100svh",
  height: "100svh",
  display: "grid",
  gridTemplateRows: "auto 1fr auto",
  padding: "clamp(16px, 4vw, 32px)",
  gap: "14px",
  overflow: "hidden",
  overscrollBehavior: "none",
  transition: "padding 420ms cubic-bezier(0.4, 0, 0.2, 1), gap 420ms cubic-bezier(0.4, 0, 0.2, 1)",
};

export default function DiagnosticFlow() {
  const { intro, questions, conclusion } = diagnosticData;
  const [answers, setAnswers] = useState<AnswerMap>(() =>
    Object.fromEntries(questions.map((question) => [question.id, ""])) as AnswerMap
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const idempotencyKey = useRef<string | null>(null);
  const touchStartY = useRef<number | null>(null);
  const lastGestureAt = useRef(0);
  const autoAdvanceRef = useRef<number | null>(null);

  const introSteps = useMemo<IntroStep[]>(
    () => [
      {
        id: "intro-cover",
        kind: "intro",
        eyebrow: intro.subtitle,
        title: intro.title,
        description: "Uma jornada imersiva feita para transformar percepção em direção comercial.",
        accent: "Direção comercial com presença",
        mode: "lens",
        panelText: "Descubra onde sua venda trava hoje e qual deve ser seu próximo movimento.",
        panelBadge: "Diagnóstico do contrato ao contato",
      },
      ...intro.paragraphs.map((paragraph, index) => ({
        id: `intro-${index + 1}`,
        kind: "intro" as const,
        eyebrow: `Manifesto ${index + 1}`,
        title:
          index === 0
            ? "Venda é presença antes de preço."
            : index === 1
              ? "Diagnóstico é espelho, não enfeite."
              : "Resposta útil vale mais que resposta bonita.",
        description: paragraph,
        accent: accentSequence[index % accentSequence.length],
        mode: modeSequence[index % modeSequence.length],
        panelText:
          index === 0
            ? "Venda começa no contato, na escuta, na intenção, na condução e na continuidade da relação."
            : index === 1
              ? "Esse diagnóstico rápido foi pensado para mostrar onde sua venda trava e onde seu próximo foco deve entrar."
              : "O que importa aqui não é responder bonito. É responder com verdade para o resultado servir na prática.",
        panelBadge:
          index === 0
            ? "Contato, escuta e condução"
            : index === 1
              ? "Clareza, segurança e resultado"
              : "Resposta útil",
      })),
    ],
    [intro.paragraphs, intro.subtitle, intro.title]
  );

  const profile = useMemo(() => getProfileFromAnswers(answers), [answers]);

  useEffect(() => {
    if (!idempotencyKey.current) {
      idempotencyKey.current = crypto.randomUUID();
    }
  }, []);

  // Auto-save em background para capturar leads parciais a cada interação (debounced)
  useEffect(() => {
    if (!idempotencyKey.current) return;
    
    // Só salva se houver alguma resposta preenchida
    const hasAnyAnswer = Object.values(answers).some((val) => val.trim().length > 0);
    if (!hasAnyAnswer) return;

    const timer = setTimeout(() => {
      saveLeadProgress(idempotencyKey.current!, answers, profile.name, { isComplete: false }).catch(() => {});
    }, 1500);

    return () => clearTimeout(timer);
  }, [answers, profile.name]);

  const resultSteps = useMemo<ResultStep[]>(() => {
    const descriptionParts = profile.description.split("\n\n");
    const firstName = getFirstName(answers[1]);

    return [
      {
        id: "result-hero",
        kind: "result",
        eyebrow: firstName ? `${firstName}, seu retrato comercial` : conclusion.title,
        title: profile.name,
        description: conclusion.template.replace("{nome do perfil}", profile.name),
        accent: profile.phrase,
        mode: "lens",
        highlight: profile.productSuggestion,
      },
      {
        id: "result-essence",
        kind: "result",
        eyebrow: "O que esse momento revela",
        title: "Seu padrão hoje",
        description: descriptionParts[0] ?? profile.description,
        accent: profile.pain,
        mode: "cube",
        highlight: profile.focus,
      },
      {
        id: "result-shift",
        kind: "result",
        eyebrow: "Seu próximo movimento",
        title: "O foco agora é claro",
        description: descriptionParts[1] ?? conclusion.message,
        accent: conclusion.message.split("\n\n")[1] ?? conclusion.message,
        mode: "bar",
        highlight: profile.focus,
      },
      {
        id: "result-actions-a",
        kind: "result",
        eyebrow: "Ações para os próximos 7 dias",
        title: "Ative sua venda",
        description: "Escolha uma ação por vez e trate cada contato como movimento estratégico.",
        accent: "Primeiros passos",
        mode: "cube",
        bullets: profile.actions.slice(0, 3).map((action) => action.title),
      },
      {
        id: "result-actions-b",
        kind: "result",
        eyebrow: "Continuidade",
        title: "O próximo passo",
        description: conclusion.cta,
        accent:
          answers[15] === "Sim"
            ? "Liberado para WhatsApp"
            : "Pronto para virar ação",
        mode: "lens",
      },
    ];
  }, [answers, conclusion.cta, conclusion.message, conclusion.template, conclusion.title, profile]);

  const endStep = useMemo<EndStep[]>(() => [
    {
      id: "flow-end",
      kind: "end",
      eyebrow: "Jornada Concluída",
      title: "Obrigado por participar",
      description: "Suas informações foram salvas com sucesso e seu diagnóstico está finalizado.",
      accent: "Até logo",
      mode: "cube",
    }
  ], []);

  const steps = useMemo<FlowStep[]>(() => {
    const questionSteps: QuestionStep[] = questions.map((question, index) => ({
      id: `question-${question.id}`,
      kind: "question",
      question,
      mode: modeSequence[(index + 1) % modeSequence.length],
      accent: accentSequence[index % accentSequence.length],
    }));

    return [...introSteps, ...questionSteps, ...resultSteps, ...endStep];
  }, [introSteps, questions, resultSteps, endStep]);

  const currentStep = steps[activeIndex];
  const answeredCount = useMemo(
    () => questions.filter((question) => (answers[question.id] ?? "").trim().length > 0).length,
    [answers, questions]
  );

  const progress = useMemo(() => {
    const introWeight = 0.16;
    const questionWeight = 0.66;
    const resultWeight = 0.18;
    const introProgress = Math.min(activeIndex + 1, introSteps.length) / introSteps.length;
    const questionProgress = answeredCount / questions.length;
    const resultProgress =
      activeIndex >= introSteps.length + questions.length
        ? (activeIndex - introSteps.length - questions.length + 1) / resultSteps.length
        : 0;

    return Math.min(
      1,
      introProgress * introWeight + questionProgress * questionWeight + resultProgress * resultWeight
    );
  }, [activeIndex, answeredCount, introSteps.length, questions.length, resultSteps.length]);

  const questionIndex =
    currentStep.kind === "question"
      ? questions.findIndex((item) => item.id === currentStep.question.id)
      : -1;
  const currentValue = currentStep.kind === "question" ? answers[currentStep.question.id] ?? "" : "";
  const canAdvance = currentStep.kind !== "question" || isQuestionComplete(currentStep.question, currentValue);

  const isQuestionStep = currentStep.kind === "question";

  const moveTo = useCallback(
    (nextIndex: number) => {
      const bounded = Math.max(0, Math.min(nextIndex, steps.length - 1));
      if (bounded === activeIndex) {
        return;
      }

      setDirection(bounded > activeIndex ? 1 : -1);
      setActiveIndex(bounded);
    },
    [activeIndex, steps.length]
  );

  const nextStep = useCallback(async () => {
    if (activeIndex === steps.length - 1) {
      return; // Already at the end step, do nothing
    }

    if (!canAdvance) {
      return;
    }

    const isLastQuestion =
      currentStep.kind === "question" &&
      steps[activeIndex + 1]?.kind === "result";

    if (isLastQuestion) {
      // Validar se todas as questões obrigatórias foram respondidas
      const unanswered = questions.filter((q) => !isQuestionComplete(q, answers[q.id] ?? ""));
      if (unanswered.length > 0) {
        setValidationError(`Você esqueceu de responder a pergunta ${unanswered[0].id}.`);
        return;
      }
      setValidationError(null);
      setIsSubmitting(true);

      try {
        const res = await saveLeadProgress(idempotencyKey.current!, answers, profile.name, { isComplete: true });

        if (!res.success) {
          throw new Error("Erro ao salvar respostas");
        }

        moveTo(activeIndex + 1);
      } catch (error) {
        setValidationError("Ocorreu um erro de conexão. Tente novamente.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      moveTo(activeIndex + 1);
    }
  }, [activeIndex, canAdvance, currentStep.kind, steps, moveTo, questions, answers, profile.name]);

  const previousStep = useCallback(() => {
    moveTo(activeIndex - 1);
  }, [activeIndex, moveTo]);

  const scrollToTop = useCallback((behavior: ScrollBehavior = "smooth") => {
    window.scrollTo({ top: 0, behavior });
    document.documentElement.scrollTo?.({ top: 0, behavior });
    document.body.scrollTo?.({ top: 0, behavior });
  }, []);

  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) {
        window.clearTimeout(autoAdvanceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    scrollToTop("auto");
  }, [activeIndex, scrollToTop]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        previousStep();
      }

      if (event.key === "ArrowDown" || event.key === "ArrowRight" || event.key === "Enter") {
        event.preventDefault();
        nextStep();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nextStep, previousStep]);

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    // Não avança se o usuário estiver rolando dentro de uma lista de opções ou textarea
    const target = event.target as HTMLElement;
    if (target.closest(".options-grid") || target.tagName.toLowerCase() === "textarea") {
      return;
    }

    event.preventDefault();

    const now = Date.now();
    if (now - lastGestureAt.current < 700) {
      return;
    }

    if (Math.abs(event.deltaY) < 28) {
      return;
    }

    lastGestureAt.current = now;
    if (event.deltaY > 0) {
      nextStep();
      return;
    }

    previousStep();
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    // Evita conflito de touch em áreas roláveis
    const target = event.target as HTMLElement;
    if (target.closest(".options-grid") || target.tagName.toLowerCase() === "textarea") {
      touchStartY.current = null;
      return;
    }

    touchStartY.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current == null) {
      return;
    }

    const endY = event.changedTouches[0]?.clientY ?? touchStartY.current;
    const delta = touchStartY.current - endY;
    touchStartY.current = null;

    if (Math.abs(delta) < 48) {
      return;
    }

    if (delta > 0) {
      nextStep();
      return;
    }

    previousStep();
  };

  const updateAnswer = (questionId: number, value: string) => {
    setAnswers((previous) => ({ ...previous, [questionId]: value }));
    scrollToTop();
  };

  const handleRadioSelect = (question: Question, option: string) => {
    updateAnswer(question.id, option);

    if (autoAdvanceRef.current) {
      window.clearTimeout(autoAdvanceRef.current);
    }

    autoAdvanceRef.current = window.setTimeout(() => {
      scrollToTop("auto");
      setDirection(1);
      setActiveIndex((previous) => Math.min(previous + 1, steps.length - 1));
    }, 320);
  };

  return (
    <main
      style={shellStyle}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <FluidGlass
        mode={currentStep.mode}
        headline={getVisualHeadline(currentStep, questionIndex + 1, questions.length, profile.name)}
        caption={getVisualCaption(currentStep)}
        stepLabel={getStepLabel(currentStep, questionIndex + 1, questions.length, activeIndex + 1, steps.length)}
        progress={progress}
        accent={currentStep.accent}
        lensProps={{
          scale: 0.14,
          ior: 1.12,
          thickness: 3.4,
          chromaticAberration: 0.07,
          anisotropy: 0.02,
        }}
        cubeProps={{
          scale: 0.14,
          ior: 1.16,
          thickness: 4.8,
          chromaticAberration: 0.09,
          anisotropy: 0.015,
        }}
        barProps={{
          scale: 0.2,
          ior: 1.1,
          thickness: 8,
          chromaticAberration: 0.04,
          anisotropy: 0.01,
        }}
      />
      <div style={overlayStyle} />
      <div style={frameStyle} className={`flow-frame ${isQuestionStep ? "flow-frame-question" : ""}`}>
        <header className={`flow-header ${isQuestionStep ? "flow-header-question" : ""}`}>
          <div className="brand-block">
            <span className="brand-kicker">Amanda Coelho</span>
            <strong className="brand-title">Diagnóstico guiado</strong>
          </div>
          <div className={`progress-shell ${isQuestionStep ? "progress-shell-hidden" : ""}`}>
            <span>{Math.round(progress * 100)}%</span>
            <div className="progress-track">
              <div className="progress-fill" style={{ transform: `scaleX(${progress})` }} />
            </div>
          </div>
        </header>

        <section
          className={`flow-card ${isQuestionStep ? "flow-card-question" : ""}`}
        >
          <article
            key={currentStep.id}
            className={`content-card ${direction > 0 ? "content-forward" : "content-backward"} ${
              isQuestionStep ? "content-card-question" : ""
            }`}
          >
            {(currentStep.kind === "intro" || currentStep.kind === "question") && (
              <div className={`content-meta ${isQuestionStep ? "content-meta-question" : ""}`}>
                <span className="meta-eyebrow">
                  {getStepLabel(currentStep, questionIndex + 1, questions.length, activeIndex + 1, steps.length)}
                </span>
                <span className="meta-separator" />
                <span className="meta-eyebrow">{currentStep.accent}</span>
              </div>
            )}

            {currentStep.kind === "intro" && (
              <div className={`story-grid ${activeIndex > 0 ? "story-grid-single" : ""}`}>
                <div className="story-copy">
                  <span className="section-kicker">{currentStep.eyebrow}</span>
                  <h1>{currentStep.title}</h1>
                  <p>{currentStep.description}</p>
                </div>
                {activeIndex === 0 && (
                  <div className="story-panel">
                    <p>
                      Role a tela para baixo e para cima para avançar e voltar, ou use os botões abaixo.
                    </p>
                    <div className="gesture-pill">
                      <span />
                      <strong>Navegação livre</strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep.kind === "question" && (
              <>
                <div className="question-grid">
                  <div className={`question-copy ${isQuestionStep ? "question-copy-hero" : ""}`}>
                    <h2>{currentStep.question.text}</h2>
                    {currentStep.question.note && <p className="question-note">{currentStep.question.note}</p>}
                  </div>

                  {currentStep.question.type === "text" && (
                    <label className="field-shell">
                      <span>Resposta</span>
                      <input
                        value={currentValue}
                        onChange={(event) => updateAnswer(currentStep.question.id, event.target.value)}
                        placeholder={
                          currentStep.question.id === 1 ? "Como você quer ser chamada?" : "Seu WhatsApp com DDD"
                        }
                        autoComplete={currentStep.question.id === 1 ? "name" : "tel"}
                      />
                    </label>
                  )}

                  {currentStep.question.type === "textarea" && (
                    <label className="field-shell textarea-shell">
                      <span>Resposta livre</span>
                      <textarea
                        value={currentValue}
                        onChange={(event) =>
                          updateAnswer(currentStep.question.id, event.target.value.slice(0, 220))
                        }
                        placeholder="Escreva com as suas palavras o que mais precisa mudar agora"
                        rows={5}
                      />
                      <small>{currentValue.length}/220</small>
                    </label>
                  )}

                  {currentStep.question.type === "radio" && currentStep.question.options && (
                    <div className="options-shell">
                      <div className="options-grid">
                        {currentStep.question.options.map((option) => {
                          const selected = currentValue === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              className={`option-card ${selected ? "option-selected" : ""}`}
                              onClick={() => handleRadioSelect(currentStep.question, option)}
                            >
                              <span className="option-index">{selected ? "✓" : "•"}</span>
                              <span>{option}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="progress-shell progress-shell-question">
                  <span>{Math.round(progress * 100)}%</span>
                  <div className="progress-track progress-track-question">
                    <div className="progress-fill" style={{ transform: `scaleX(${progress})` }} />
                  </div>
                </div>
              </>
            )}

            {currentStep.kind === "result" && (
              <div className={`result-grid ${(!currentStep.highlight && (!currentStep.bullets || currentStep.bullets.length === 0)) ? "result-grid-single" : ""}`}>
                <div className="story-copy">
                  <span className="section-kicker">{currentStep.eyebrow}</span>
                  <h2>{currentStep.title}</h2>
                  <p>{currentStep.description}</p>
                </div>
                {(currentStep.highlight || (currentStep.bullets && currentStep.bullets.length > 0)) && (
                  <div className="result-panel">
                    {currentStep.highlight && <div className="result-highlight">{currentStep.highlight}</div>}
                    {currentStep.bullets && currentStep.bullets.length > 0 && (
                      <ul>
                        {currentStep.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentStep.kind === "end" && (
              <div className="story-grid story-grid-single">
                <div className="story-copy">
                  <span className="section-kicker">{currentStep.eyebrow}</span>
                  <h2>{currentStep.title}</h2>
                  <p>{currentStep.description}</p>
                </div>
              </div>
            )}
          </article>

          <footer className={`flow-footer ${isQuestionStep ? "flow-footer-question" : ""}`}>
            <div className={`footer-actions ${isQuestionStep ? "footer-actions-question" : ""}`}>
              {currentStep.kind !== "end" && (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={previousStep}
                  disabled={activeIndex === 0 || isSubmitting}
                >
                  Voltar
                </button>
              )}
              {currentStep.kind !== "end" && (
                <button 
                  type="button" 
                  className="primary-button" 
                  onClick={nextStep} 
                  disabled={!canAdvance || isSubmitting}
                >
                  {isSubmitting
                    ? "Salvando..."
                    : currentStep.kind === "question" && steps[activeIndex + 1]?.kind === "result"
                      ? "Finalizar Diagnóstico"
                      : currentStep.kind === "question" && currentStep.question.type === "radio"
                        ? "Avançar"
                        : "Continuar"}
                </button>
              )}
            </div>
            {validationError && (
              <div className="validation-error">
                {validationError}
              </div>
            )}
          </footer>
        </section>
      </div>

      <style jsx>{`
        .flow-frame {
          transition: padding 420ms cubic-bezier(0.4, 0, 0.2, 1), gap 420ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .flow-frame-question {
          padding: 0 !important;
          gap: 0 !important;
        }

        .flow-card {
          isolation: isolate;
          position: relative;
          z-index: 1;
          min-height: 0;
          border-radius: 32px;
          border: 1px solid rgba(255,244,236,0.12);
          background: linear-gradient(180deg, rgba(35,8,12,0.72) 0%, rgba(0, 0, 0, 0.9) 100%);
          box-shadow: 0 30px 120px rgba(0, 0, 0, 0.42);
          backdrop-filter: blur(22px);
          overflow: hidden;
          display: grid;
          grid-template-rows: 1fr auto;
          margin-bottom: clamp(16px, 3vh, 32px);
          transition:
            margin 420ms cubic-bezier(0.4, 0, 0.2, 1),
            border-radius 420ms cubic-bezier(0.4, 0, 0.2, 1),
            box-shadow 420ms cubic-bezier(0.4, 0, 0.2, 1),
            background 420ms cubic-bezier(0.4, 0, 0.2, 1),
            border-color 420ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .flow-card-question {
          grid-row: 1 / -1;
          position: absolute;
          inset: 0;
          height: 100svh;
          margin: 0;
          border-radius: 0;
          border-color: transparent;
          background: linear-gradient(180deg, rgba(18, 4, 7, 0.8) 0%, rgba(3, 1, 2, 0.96) 100%);
          box-shadow: none;
          backdrop-filter: blur(42px);
          -webkit-backdrop-filter: blur(42px);
          z-index: 1;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          padding-top: clamp(64px, 12vh, 90px);
          padding-bottom: 0;
        }

        .flow-card-question .content-card {
          flex: 1;
        }

        .flow-card-question .flow-footer {
          margin-top: auto;
        }

        .flow-card-question::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          background: 
            radial-gradient(circle at 50% -20%, rgba(246, 185, 142, 0.22), transparent 50%),
            radial-gradient(circle at 50% 120%, rgba(246, 185, 142, 0.1), transparent 50%);
          opacity: 0;
          animation: fadeIn 800ms ease forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .flow-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 6px 4px 0;
          position: relative;
          z-index: 3;
          transition: 
            padding 420ms cubic-bezier(0.4, 0, 0.2, 1),
            transform 420ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .flow-header-question {
          padding: clamp(16px, 4vw, 32px) clamp(20px, 5vw, 40px) 0;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          box-sizing: border-box;
          z-index: 5;
        }

        .brand-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
          transition: transform 420ms ease;
        }

        .flow-header-question .brand-block {
          transform: translateY(4px);
        }

        .brand-kicker,
        .viewport-footer,
        .meta-eyebrow,
        .section-kicker,
        .field-shell span,
        .field-shell small,
        .option-pager span,
        .footer-status span {
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255, 230, 216, 0.72);
        }

        .brand-title {
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .progress-shell {
          min-width: 124px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          transition: opacity 320ms ease, transform 320ms ease;
          opacity: 1;
          transform: translateY(0);
        }

        .progress-shell-hidden {
          opacity: 0;
          transform: translateY(-8px);
          pointer-events: none;
        }

        .progress-shell-question {
          min-width: 100%;
          width: 100%;
          align-items: center;
          padding: 0;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
          transform: none;
          margin-top: 16px;
        }

        .progress-track {
          width: 100%;
          height: 6px;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(255, 244, 236, 0.12);
          transform: translateZ(0);
          transition: all 420ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .progress-track-question {
          height: 12px;
          background: rgba(255, 244, 236, 0.1);
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .progress-fill {
          width: 100%;
          height: 100%;
          transform-origin: left center;
          background: linear-gradient(90deg, #f6b98e 0%, #fff1e7 100%);
          border-radius: 40px;
          transition: transform 420ms ease, filter 320ms ease;
          filter: saturate(1);
        }

        .content-card {
          min-height: 0;
          display: grid;
          grid-template-rows: auto 1fr;
          padding: clamp(20px, 4vw, 36px);
          gap: clamp(16px, 3vw, 24px);
          animation-duration: 560ms;
          animation-fill-mode: both;
          transition: padding 420ms cubic-bezier(0.4, 0, 0.2, 1), gap 420ms cubic-bezier(0.4, 0, 0.2, 1), transform 420ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .content-card-question {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding:
            clamp(16px, 3vh, 40px)
            clamp(20px, 5vw, 40px)
            clamp(16px, 3vh, 32px);
          gap: clamp(24px, 4vw, 36px);
          transform: none;
          animation: contentSettle 600ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }

        .content-card-question > * {
          width: 100%;
          max-width: 600px;
          margin-inline: auto;
        }

        @keyframes contentSettle {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .content-forward {
          animation-name: cardInForward;
        }

        .content-backward {
          animation-name: cardInBackward;
        }

        .content-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          transition:
            padding 320ms ease,
            margin 320ms ease,
            background 320ms ease,
            border-color 320ms ease,
            border-radius 320ms ease,
            transform 320ms ease;
        }

        .content-meta-question {
          padding: 0;
          margin-inline: 0;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
          transform: none;
        }

        .meta-separator {
          width: 12px;
          height: 0.5px;
          background: rgba(255, 255, 255, 0.2);
        }

        .story-grid,
        .question-grid,
        .result-grid {
          min-height: 0;
          display: grid;
          gap: clamp(16px, 3vw, 24px);
          align-items: center;
          align-content: center;
          transition: gap 320ms ease, transform 320ms ease;
        }

        .story-grid-single,
        .result-grid-single {
          grid-template-columns: 1fr !important;
        }

        .story-copy,
        .question-copy {
          display: flex;
          flex-direction: column;
          gap: 14px;
          justify-content: center;
          transition: transform 360ms ease, opacity 320ms ease;
        }

        .question-copy-hero {
          transform: translateY(-2px);
        }

        h1,
        h2 {
          margin: 0;
          font-family: var(--font-display);
          font-size: clamp(2rem, 8vw, 4.7rem);
          line-height: 0.92;
          font-weight: 600;
          letter-spacing: -0.05em;
          max-width: 11ch;
          word-break: normal;
          overflow-wrap: normal;
          hyphens: manual;
          text-wrap: balance;
        }

        p {
          margin: 0;
          max-width: 34rem;
          font-size: clamp(1rem, 3.7vw, 1.12rem);
          line-height: 1.5;
          color: rgba(255, 236, 225, 0.86);
        }

        .story-panel,
        .result-panel {
          padding: 18px;
          border-radius: 24px;
          border: 1px solid rgba(255, 244, 236, 0.12);
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.06) 0%,
            rgba(255, 255, 255, 0.03) 100%
          );
          backdrop-filter: blur(12px);
          display: flex;
          flex-direction: column;
          gap: 18px;
          align-self: stretch;
          justify-content: space-between;
        }

        .gesture-pill {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 999px;
          background: rgba(255, 243, 235, 0.08);
          color: #fff1e7;
        }

        .gesture-pill span,
        .alt-pill span {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: linear-gradient(180deg, #f6b98e 0%, #fff1e7 100%);
          box-shadow: 0 0 26px rgba(255, 241, 231, 0.65);
        }

        .question-note {
          color: #f6b98e;
          font-size: 0.95rem;
        }

        .field-shell {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 0;
          border: none;
          background: transparent;
          justify-content: flex-start;
        }

        .field-shell input,
        .field-shell textarea {
          width: 100%;
          border: 1px solid rgba(255, 244, 236, 0.16);
          outline: none;
          resize: none;
          border-radius: 20px;
          padding: 20px 24px;
          background: rgba(255, 244, 236, 0.04);
          color: #fff4ec;
          font: inherit;
          line-height: 1.45;
          box-sizing: border-box;
          transition: border-color 220ms ease, background 220ms ease;
        }

        .field-shell input:focus,
        .field-shell textarea:focus {
          border-color: rgba(246, 185, 142, 0.4);
          background: rgba(255, 244, 236, 0.08);
        }

        .field-shell input::placeholder,
        .field-shell textarea::placeholder {
          color: rgba(255, 228, 214, 0.42);
        }

        .textarea-shell {
          min-height: 220px;
        }

        .options-shell {
          display: flex;
          flex-direction: column;
          gap: 14px;
          align-content: end;
        }

        .options-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          max-height: 45vh;
          overflow-y: auto;
          padding-right: 8px;
          scrollbar-width: thin;
          scrollbar-color: rgba(246, 185, 142, 0.4) transparent;
        }

        .options-grid::-webkit-scrollbar {
          width: 4px;
        }

        .options-grid::-webkit-scrollbar-track {
          background: transparent;
        }

        .options-grid::-webkit-scrollbar-thumb {
          background-color: rgba(246, 185, 142, 0.4);
          border-radius: 4px;
        }

        .option-card {
          border: 1px solid rgba(255, 244, 236, 0.12);
          background: rgba(255, 244, 236, 0.05);
          color: #fff4ec;
          border-radius: 22px;
          padding: 14px 16px;
          text-align: left;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: start;
          font: inherit;
          transition: transform 220ms ease, background 220ms ease, border-color 220ms ease;
        }

        .option-card:active {
          transform: scale(0.985);
        }

        .option-selected {
          background: linear-gradient(
            135deg,
            rgba(246, 185, 142, 0.18) 0%,
            rgba(230, 176, 140, 0.08) 100%
          );
          border-color: rgba(246, 185, 142, 0.42);
        }

        .option-index {
          font-weight: 700;
          color: #f6b98e;
        }

        .option-pager {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .option-pager button,
        .ghost-button,
        .primary-button {
          border: none;
          border-radius: 999px;
          padding: 14px 18px;
          font: inherit;
          letter-spacing: 0.02em;
        }

        .option-pager button,
        .ghost-button {
          background: rgba(255, 244, 236, 0.08);
          color: #fff4ec;
        }

        .option-pager button:disabled,
        .ghost-button:disabled,
        .primary-button:disabled {
          opacity: 0.35;
        }

        .result-highlight {
          padding: 16px 18px;
          border-radius: 20px;
          background: linear-gradient(
            135deg,
            rgba(246, 185, 142, 0.18) 0%,
            rgba(246, 185, 142, 0.06) 100%
          );
          color: #fff1e7;
          line-height: 1.45;
        }

        .result-panel ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 12px;
        }

        .result-panel li {
          padding: 14px 16px;
          border-radius: 18px;
          background: rgba(255, 244, 236, 0.05);
          border: 1px solid rgba(255, 244, 236, 0.1);
          line-height: 1.42;
          color: rgba(255, 239, 229, 0.92);
        }

        .flow-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px clamp(20px, 4vw, 32px) 20px;
          border-top: 1px solid rgba(255, 244, 236, 0.08);
          background: linear-gradient(180deg, rgba(20, 4, 7, 0.1) 0%, rgba(20, 4, 7, 0.45) 100%);
          position: relative;
          z-index: 2;
          transition:
            padding 420ms cubic-bezier(0.4, 0, 0.2, 1),
            background 420ms cubic-bezier(0.4, 0, 0.2, 1),
            border-color 420ms cubic-bezier(0.4, 0, 0.2, 1),
            transform 420ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .flow-footer-question {
          padding: 16px clamp(20px, 5vw, 40px) clamp(20px, 5vh, 32px);
          background: linear-gradient(180deg, rgba(20, 4, 7, 0.02) 0%, rgba(20, 4, 7, 0.18) 100%);
          border-top-color: rgba(255, 244, 236, 0.1);
          transform: none;
        }

        .footer-status {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .footer-status strong {
          font-size: 1.35rem;
          font-weight: 700;
          font-family: var(--font-display);
        }

        .footer-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          transition: gap 320ms ease, transform 320ms ease;
        }

        .footer-actions-question {
          gap: 12px;
          transform: translateY(2px);
        }

        .primary-button {
          background: linear-gradient(135deg, #f6b98e 0%, #fff1e7 100%);
          color: #2a060a;
          font-weight: 700;
        }

        .viewport-footer {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 0 4px 4px;
          position: relative;
          z-index: 3;
          transition: opacity 320ms ease, transform 320ms ease;
        }

        .viewport-footer-question {
          display: none;
        }

        @keyframes questionShellIn {
          from {
            opacity: 0;
            transform: scale(0.985);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes cardInForward {
          from {
            opacity: 0;
            transform: translate3d(0, 34px, 0) scale(0.985);
            filter: blur(10px);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes cardInBackward {
          from {
            opacity: 0;
            transform: translate3d(0, -34px, 0) scale(0.985);
            filter: blur(10px);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0);
          }
        }

        @media (min-width: 860px) {
          .story-grid,
          .question-grid,
          .result-grid {
            grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
          }

          .options-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 859px) {
          .flow-card-question {
            border-radius: 0;
          }

          .instagram-card {
            min-height: 0;
          }

          .flow-header-question {
            transform: none;
          }

          .content-meta-question {
            display: none;
          }

          .progress-shell-question {
            width: 100%;
            min-width: 0;
          }

          .flow-header,
          .flow-footer,
          .viewport-footer {
            flex-direction: column;
            align-items: stretch;
          }

          .flow-header {
            gap: 12px;
          }

          .progress-shell {
            width: 100%;
            min-width: 100%;
            align-items: flex-start;
            flex-direction: row-reverse;
            justify-content: space-between;
          }

          .progress-shell span {
            margin-top: -3px;
          }

          .footer-actions {
            width: 100%;
          }

          .footer-actions {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .viewport-footer {
            gap: 6px;
            align-items: center;
          }

          h1, h2 {
            font-size: clamp(1.8rem, 10vw, 2.5rem);
            word-break: normal;
            overflow-wrap: normal;
            hyphens: manual;
            text-wrap: balance;
          }
        }
        .validation-error {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 12px;
          padding: 10px 16px;
          background: rgba(224, 71, 91, 0.15);
          border: 1px solid rgba(224, 71, 91, 0.3);
          border-radius: 12px;
          color: #ffb3b8;
          font-size: 0.85rem;
          font-weight: 500;
          text-align: center;
          white-space: nowrap;
          backdrop-filter: blur(8px);
          animation: popIn 300ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        @keyframes popIn {
          from {
            opacity: 0;
            transform: translate(-50%, 8px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </main>
  );
}



function isQuestionComplete(question: Question, value: string) {
  if (question.type === "text") {
    return value.trim().length >= 2;
  }

  if (question.type === "textarea") {
    return value.trim().length >= 12;
  }

  return value.trim().length > 0;
}

function getFirstName(name: string) {
  return name.trim().split(" ")[0] ?? "";
}

function getStepLabel(
  step: FlowStep,
  questionNumber: number,
  totalQuestions: number,
  visualIndex: number,
  totalSteps: number
) {
  if (step.kind === "question") {
    return `Questão ${questionNumber} de ${totalQuestions}`;
  }

  if (step.kind === "result") {
    return `Leitura ${visualIndex - totalQuestions} de ${totalSteps - totalQuestions}`;
  }

  return `${visualIndex}/${totalSteps}`;
}

function getVisualHeadline(step: FlowStep, questionNumber: number, totalQuestions: number, profileName: string) {
  if (step.kind === "question") {
    return `${questionNumber}/${totalQuestions}`;
  }

  if (step.kind === "result") {
    return profileName;
  }

  return step.title;
}

function getVisualCaption(step: FlowStep) {
  if (step.kind === "question") {
    return step.question.text;
  }

  return step.description;
}

function getProfileFromAnswers(answers: AnswerMap): Profile {
  const score = {
    automatico: 0,
    relacao: 0,
    jogo: 0,
  };

  const add = (profile: keyof typeof score, points: number) => {
    score[profile] += points;
  };

  const match = (questionId: number, option: string, profile: keyof typeof score, points: number) => {
    if (answers[questionId] === option) {
      add(profile, points);
    }
  };

  match(4, "Eu vendo quando o cliente me procura", "automatico", 4);
  match(4, "Eu até abordo, mas tenho medo de parecer insistente", "automatico", 3);
  match(4, "Eu converso bem, mas travo na hora de fechar", "relacao", 4);
  match(4, "Eu vendo, mas não tenho constância", "jogo", 3);
  match(4, "Eu tenho clientes, mas não sei gerar recompra", "jogo", 3);
  match(4, "Eu vendo bem, mas quero ter mais método e previsibilidade", "jogo", 4);

  match(5, "Abordar clientes novos", "automatico", 3);
  match(5, "Saber o que falar no primeiro contato", "automatico", 2);
  match(5, "Entender a real necessidade do cliente", "relacao", 2);
  match(5, "Mostrar valor sem depender de desconto", "relacao", 3);
  match(5, "Responder objeções", "relacao", 3);
  match(5, "Fechar a venda", "relacao", 3);
  match(5, "Fazer pós-venda", "jogo", 2);
  match(5, "Vender todos os dias com constância", "jogo", 3);
  match(5, "Organizar meus contatos e oportunidades", "jogo", 3);

  match(6, "Espero ele voltar sozinho", "automatico", 3);
  match(6, "Mando uma mensagem depois, mas sem muita estratégia", "automatico", 2);
  match(6, "Tento insistir um pouco, mas fico insegura", "relacao", 2);
  match(6, "Faço perguntas para entender o que ficou em dúvida", "relacao", 3);
  match(6, "Tenho um processo claro para retomar a conversa", "jogo", 3);

  match(7, "O cliente some depois do preço", "relacao", 3);
  match(7, "Eu demoro para responder ou acompanhar", "jogo", 2);
  match(7, "Eu fico com vergonha de chamar de novo", "automatico", 3);
  match(7, "Eu não sei criar urgência sem pressionar", "relacao", 2);
  match(7, "Eu explico muito, mas não conduzo para a decisão", "relacao", 3);
  match(7, "Eu não tenho uma oferta clara", "relacao", 2);
  match(7, "Eu não sei manter relacionamento depois do atendimento", "jogo", 2);

  if (["1 = quase nunca. Eu vou respondendo conforme o cliente fala", "2 = poucas vezes"].includes(answers[8])) {
    add("automatico", 3);
  }
  if (answers[8] === "3 = às vezes") {
    add("relacao", 2);
  }
  if (answers[8] === "4 = muitas vezes") {
    add("relacao", 1);
    add("jogo", 2);
  }
  if (answers[8] === "5 = quase sempre. Eu sei conduzir do contato ao fechamento") {
    add("jogo", 4);
  }

  if (["1 = tenho muita dificuldade", "2 = fico insegura"].includes(answers[9])) {
    add("relacao", 3);
  }
  if (answers[9] === "3 = depende do cliente") {
    add("relacao", 2);
    add("jogo", 1);
  }
  if (answers[9] === "4 = consigo falar bem") {
    add("relacao", 1);
    add("jogo", 2);
  }
  if (answers[9] === "5 = falo com segurança e mostro valor antes do preço") {
    add("jogo", 4);
  }

  match(10, "Abordagem", "automatico", 3);
  match(10, "WhatsApp comercial", "automatico", 2);
  match(10, "Apresentação do produto ou serviço", "relacao", 2);
  match(10, "Quebra de objeções", "relacao", 3);
  match(10, "Fechamento", "relacao", 3);
  match(10, "Pós-venda", "jogo", 2);
  match(10, "Recompra", "jogo", 3);
  match(10, "Organização da rotina comercial", "jogo", 3);
  match(10, "Relacionamento com cliente", "relacao", 1);
  match(10, "Relacionamento com cliente", "jogo", 1);

  match(12, "Confiança", "automatico", 2);
  match(12, "Coragem", "automatico", 2);
  match(12, "Técnica", "relacao", 2);
  match(12, "Clareza na comunicação", "relacao", 3);
  match(12, "Exemplos práticos", "relacao", 1);
  match(12, "Roteiros prontos", "relacao", 2);
  match(12, "Método", "jogo", 3);
  match(12, "Disciplina", "jogo", 2);
  match(12, "Organização", "jogo", 3);
  match(12, "Acompanhamento", "jogo", 3);

  match(13, "Mensagens prontas para abordar clientes", "automatico", 3);
  match(13, "Desafio de vendas de poucos dias", "automatico", 2);
  match(13, "Roteiro de venda pelo WhatsApp", "relacao", 2);
  match(13, "Passo a passo para fechar mais", "relacao", 3);
  match(13, "Aula prática sobre objeções", "relacao", 3);
  match(13, "Treinamento com exemplos reais", "relacao", 2);
  match(13, "Checklist de pós-venda", "jogo", 2);
  match(13, "Plano de rotina comercial", "jogo", 3);
  match(13, "Mentoria em grupo", "jogo", 3);

  if (answers[11].trim().length > 0) {
    const text = answers[11].toLowerCase();
    if (/(abord|chamar|incomod|vergonha|constância)/.test(text)) {
      add("automatico", 2);
    }
    if (/(fechar|obje|preço|valor|decisão)/.test(text)) {
      add("relacao", 2);
    }
    if (/(rotina|processo|método|recompra|acompanh|organ)/.test(text)) {
      add("jogo", 2);
    }
  }

  const sorted = Object.entries(score).sort((a, b) => b[1] - a[1]);
  const winner = sorted[0]?.[0] ?? "automatico";

  return diagnosticData.profiles.find((profile) => profile.id === winner) ?? diagnosticData.profiles[0];
}
