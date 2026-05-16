"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        setError("Senha incorreta");
      }
    } catch (err) {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="brand-header">
          <Image src="/assets/logo.png" alt="Logo" width={48} height={48} className="vercel-logo" />
          <h2>Log in to Dashboard</h2>
        </div>
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your admin password"
              required
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? "Verifying..." : "Continue"}
          </button>
        </form>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          padding: 40px;
          background: #ffffff;
          border-radius: 12px;
        }

        .brand-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 32px;
        }

        .vercel-logo {
          height: 48px;
          object-fit: contain;
          margin-bottom: 24px;
        }

        h2 {
          font-size: 24px;
          font-weight: 600;
          color: #000;
          margin: 0;
          letter-spacing: -0.04em;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        label {
          font-size: 14px;
          font-weight: 500;
          color: #444;
        }

        input {
          width: 100%;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #eaeaea;
          background: #fff;
          font-size: 14px;
          color: #000;
          transition: border-color 0.15s ease;
          box-sizing: border-box;
        }

        input:focus {
          outline: none;
          border-color: #000;
        }

        .btn-submit {
          width: 100%;
          padding: 12px;
          margin-top: 8px;
          border-radius: 6px;
          border: none;
          background: #000;
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .btn-submit:hover {
          background: #333;
        }

        .btn-submit:disabled {
          background: #888;
          cursor: not-allowed;
        }

        .error-msg {
          color: #e00;
          font-size: 13px;
          margin: 0;
        }
      `}</style>
    </div>
  );
}