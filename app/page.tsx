"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import StructuredData from "@/components/StructuredData";
import Navbar from "./components/Navbar";
import Brand from "@/components/Brand";
import Icon from "@/components/Icon";
import PitchPreview from "@/components/PitchPreview";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  return (
    <div className="landing">
      <StructuredData />
      <Navbar />
      <main id="main-content">
        <section className="home-hero page-width">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="tiny-line" /> IL TUO GRUPPO. IL TUO CAMPO.
            </div>
            <h1>
              Meno chat.
              <br />
              Più{" "}
              <span className="hero-word">
                partite.
                <svg
                  viewBox="0 0 400 18"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M3 12Q190-5 397 8" />
                </svg>
              </span>
            </h1>
            <p>
              Metti insieme gli amici, crea squadre equilibrate e tieni il conto
              delle sfide. Il tuo torneo, finalmente tutto in un posto.
            </p>
            <div className="hero-actions">
              <Link href="/register" className="btn btn-primary btn-lg">
                Organizza il tuo torneo
                <Icon name="arrow" />
              </Link>
              <Link href="/balancer" className="hero-secondary">
                Crea solo le squadre
                <Icon name="chevron" size={17} />
              </Link>
            </div>
            <div className="hero-note">
              <Icon name="check" size={16} />
              Gratis, anche per il più competitivo del gruppo.
            </div>
            <div className="hero-sports">
              <span>FATTO PER IL TUO SPORT</span>
              <div>
                Calcio <i /> Basket <i /> Volley
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-label">
              <Icon name="pitch" size={17} />
              <span>DAL GRUPPO AL CAMPO</span>
              <span className="visual-label-line" />
            </div>
            <PitchPreview />
            <div className="visual-footnote">
              <span>01 / SI PARTE DAI GIOCATORI</span>
              <span>
                IL RESTO VIENE DA SÉ <Icon name="arrow" size={14} />
              </span>
            </div>
          </div>
        </section>
        <section id="come-funziona" className="how-section">
          <div className="page-width">
            <div className="section-heading">
              <div>
                <p className="eyebrow">MENO ORGANIZZAZIONE, PIÙ GIOCO</p>
                <h2>Dal «chi c’è?» al fischio d’inizio.</h2>
              </div>
              <p>
                Tre passaggi chiari.
                <br />E siete pronti a scendere in campo.
              </p>
            </div>
            <div className="steps-grid">
              {[
                {
                  number: "01",
                  icon: "users" as const,
                  title: "Raduna il gruppo",
                  text: "Crea un torneo e condividi il codice d’invito. Ogni amico entra con il suo nome e il suo ruolo.",
                },
                {
                  number: "02",
                  icon: "shuffle" as const,
                  title: "Fai le squadre, senza discussioni",
                  text: "Scegli chi gioca. Bilanciamo ruoli e valutazioni, poi puoi spostare i giocatori come preferisci.",
                },
                {
                  number: "03",
                  icon: "trophy" as const,
                  title: "Giocate. Al resto pensiamo noi.",
                  text: "Segna i gol, vota l’MVP e ritrova risultati e classifiche nel tuo torneo. Sfida dopo sfida.",
                },
              ].map((step) => (
                <article key={step.number} className="step-card">
                  <div className="step-top">
                    <Icon name={step.icon} size={25} />
                    <span>{step.number}</span>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="home-quickstart page-width">
          <div className="quickstart-art" aria-hidden="true">
            <Icon name="pitch" size={72} />
            <span>5 vs 5</span>
          </div>
          <div>
            <p className="eyebrow">SIETE GIÀ TUTTI PRONTI?</p>
            <h2>Servono solo due squadre?</h2>
            <p>
              Aggiungi nomi, ruoli e valutazioni. Le formazioni sono pronte in
              pochi clic, senza creare un account.
            </p>
          </div>
          <Link href="/balancer" className="btn btn-outline">
            Crea le squadre
            <Icon name="arrow" />
          </Link>
        </section>
      </main>
      <footer className="site-footer page-width">
        <Brand />
        <p>Il bello è giocare insieme.</p>
        <span>© {new Date().getFullYear()} Squadra Ideale</span>
      </footer>
    </div>
  );
}
