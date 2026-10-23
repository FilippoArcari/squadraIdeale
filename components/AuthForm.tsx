"use client";

import { useRef, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Brand from "./Brand";
import Icon from "./Icon";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const register = mode === "register";
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const showError = (message: string) => {
    setError(message);
    requestAnimationFrame(() => errorRef.current?.focus());
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email")).trim();
    const password = String(data.get("password"));
    setBusy(true);
    setError("");
    try {
      if (register) {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: String(data.get("name")).trim(),
            email,
            password,
          }),
        });
        const body = await res.json();
        if (!res.ok) {
          showError(
            body.message === "User already exists"
              ? "Questa email è già registrata. Accedi con il tuo account."
              : "Non siamo riusciti a creare l’account. Controlla i dati e riprova.",
          );
          return;
        }
        setSuccess(true);
      } else {
        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (!res || res.error) {
          showError("Email o password non corrette. Controllale e riprova.");
          return;
        }
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      showError("Connessione interrotta. Riprova tra un momento.");
    } finally {
      setBusy(false);
    }
  };
  const handleGoogle = async () => {
    setBusy(true);
    setError("");
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      showError(
        "Accesso con Google non disponibile. Riprova o usa la tua email.",
      );
      setBusy(false);
    }
  };

  return (
    <div className="auth-layout">
      <aside className="auth-story">
        <Brand />
        <div className="auth-story-content">
          <p className="eyebrow">IL TUO GRUPPO. IL TUO CAMPO.</p>
          <h2>
            Le partite belle
            <br />
            iniziano prima
            <br />
            del fischio.
          </h2>
          <p>
            Ritrova il piacere di giocare insieme. A organizzare, questa volta,
            ti aiutiamo noi.
          </p>
          <div className="auth-benefits">
            <div>
              <Icon name="users" size={19} />
              Il gruppo riunito in un solo torneo
            </div>
            <div>
              <Icon name="shuffle" size={19} />
              Squadre equilibrate, meno discussioni
            </div>
            <div>
              <Icon name="trophy" size={19} />
              Ogni gol e ogni vittoria contano
            </div>
          </div>
        </div>
        <p className="auth-story-foot">
          Squadra Ideale · Fatto per chi gioca insieme.
        </p>
        <div className="auth-field-art" aria-hidden="true" />
      </aside>
      <main id="main-content" className="auth-main">
        <div className="auth-mobile-brand">
          <Brand />
        </div>
        <Link href="/" className="breadcrumb-link">
          <Icon name="back" size={15} />
          Torna al sito
        </Link>
        {success ? (
          <div className="auth-success" role="status">
            <Icon name="check" size={28} />
            <h1>Ci sei anche tu.</h1>
            <p>
              Il tuo account è pronto. Accedi per creare un torneo o raggiungere
              il tuo gruppo.
            </p>
            <Link href="/login" className="btn btn-primary">
              Vai all’accesso
              <Icon name="arrow" size={17} />
            </Link>
          </div>
        ) : (
          <>
            <h1>{register ? "Entra in squadra." : "Bentornato in campo."}</h1>
            <p className="auth-subtitle">
              {register
                ? "Crea il tuo account gratuito. Poi si pensa a giocare."
                : "Accedi per ritrovare il tuo gruppo e le vostre sfide."}
            </p>
            <form
              onSubmit={handleSubmit}
              className="auth-form"
              aria-busy={busy}
            >
              {register && (
                <div className="form-control">
                  <label htmlFor="auth-name" className="field-label">
                    Nome e cognome
                  </label>
                  <input
                    id="auth-name"
                    name="name"
                    className="input"
                    required
                    maxLength={100}
                    autoComplete="name"
                    placeholder="Mario Rossi"
                  />
                </div>
              )}
              <div className="form-control">
                <label htmlFor="auth-email" className="field-label">
                  Email
                </label>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  className="input"
                  required
                  autoComplete="email"
                  placeholder="nome@esempio.it"
                />
              </div>
              <div className="form-control">
                <label htmlFor="auth-password" className="field-label">
                  Password
                </label>
                <div className="password-field">
                  <input
                    id="auth-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className="input"
                    required
                    autoComplete={
                      register ? "new-password" : "current-password"
                    }
                    placeholder={
                      register ? "Scegli una password" : "La tua password"
                    }
                  />
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Nascondi password" : "Mostra password"
                    }
                    aria-pressed={showPassword}
                  >
                    <Icon name="eye" size={18} />
                  </button>
                </div>
              </div>
              {error && (
                <p
                  ref={errorRef}
                  tabIndex={-1}
                  className="inline-error"
                  role="alert"
                >
                  {error}
                </p>
              )}
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    Un momento…
                  </>
                ) : (
                  <>
                    {register ? "Crea account gratuito" : "Accedi"}
                    <Icon name="arrow" size={17} />
                  </>
                )}
              </button>
            </form>
            <div className="auth-divider">oppure</div>
            <button
              className="btn btn-outline google-button"
              onClick={handleGoogle}
              disabled={busy}
            >
              <svg
                viewBox="0 0 48 48"
                width="18"
                height="18"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M43.6 20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.6-5.7A19.8 19.8 0 0 0 24 4C13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.4-.1-2.7-.4-4Z"
                />
                <path
                  fill="#34A853"
                  d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2a12 12 0 0 1-18.5-5.7l-6.5 5A20 20 0 0 0 24 44Z"
                />
                <path
                  fill="#FBBC05"
                  d="M12 24c0-1.4.2-2.7.7-4l-6.5-5A20 20 0 0 0 4 24c0 3.2.8 6.2 2.2 8.9l6.5-5A12 12 0 0 1 12 24Z"
                />
                <path
                  fill="#EA4335"
                  d="M24 12c3.1 0 5.9 1.2 8 3l5.6-5.7A19.8 19.8 0 0 0 24 4a20 20 0 0 0-17.8 11l6.5 5A12 12 0 0 1 24 12Z"
                />
              </svg>
              Continua con Google
            </button>
            <p className="auth-switch">
              {register ? "Hai già un account?" : "Prima volta qui?"}{" "}
              <Link href={register ? "/login" : "/register"}>
                {register ? "Accedi" : "Crea un account"}
              </Link>
            </p>
          </>
        )}
      </main>
    </div>
  );
}
