"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import StructuredData from "@/components/StructuredData";


export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect authenticated users to dashboard
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  // Show landing page only for unauthenticated users
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (status === "authenticated") {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10">
      <StructuredData />
      {/* Navbar */}
      <div className="navbar bg-base-100/80 backdrop-blur-md shadow-lg sticky top-0 z-50">
        <div className="flex-1">
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ⚽ Squadra Ideale
          </span>
        </div>
        <div className="flex-none gap-2">
          <Link href="/login" className="btn btn-ghost">
            Accedi
          </Link>
          <Link href="/register" className="btn btn-primary">
            Registrati
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="hero min-h-[70vh] relative overflow-hidden">
        <div className="hero-content text-center max-w-4xl px-4">
          <div className="space-y-8 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Crea la Tua
              </span>
              <br />
              <span className="text-base-content">Squadra Perfetta</span>
            </h1>
            <p className="text-xl md:text-2xl text-base-content/80 max-w-2xl mx-auto leading-relaxed">
              Organizza tornei, bilancia le squadre automaticamente e tieni traccia delle statistiche dei tuoi giocatori.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link href="/register" className="btn btn-primary btn-lg shadow-xl hover:shadow-2xl transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Inizia Gratis
              </Link>
              <Link href="/balancer" className="btn btn-outline btn-lg border-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Prova Subito
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-20 bg-base-200/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Come Funziona
            </h2>
            <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
              Tre semplici passi per gestire i tuoi tornei sportivi
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="card-body items-center text-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="card-title text-2xl mb-2">Crea Tornei</h3>
                <p className="text-base-content/70">
                  Organizza tornei di calcio, basket o volley. Aggiungi i tuoi giocatori e inizia subito.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="card-body items-center text-center">
                <div className="bg-secondary/10 p-4 rounded-full mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="card-title text-2xl mb-2">Bilancia Squadre</h3>
                <p className="text-base-content/70">
                  L'algoritmo automatico crea squadre equilibrate basandosi sul rating dei giocatori.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="card-body items-center text-center">
                <div className="bg-accent/10 p-4 rounded-full mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="card-title text-2xl mb-2">Statistiche</h3>
                <p className="text-base-content/70">
                  Traccia gol, vittorie e MVP. Visualizza classifiche aggiornate in tempo reale.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="py-20 bg-base-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Tutto Quello Che Ti Serve
            </h2>
          </div>

          <div className="max-w-4xl mx-auto space-y-12">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-left">
                <div className="badge badge-primary badge-lg mb-4">Passo 1</div>
                <h3 className="text-3xl font-bold mb-3">Registra i Giocatori</h3>
                <p className="text-lg text-base-content/70">
                  Aggiungi i tuoi amici al torneo. Assegna un rating a ciascun giocatore per creare partite equilibrate.
                </p>
              </div>
              <div className="flex-1">
                <div className="mockup-window border bg-base-300 shadow-2xl">
                  <div className="bg-base-200 px-4 py-8 text-center">
                    <div className="text-4xl mb-2">👥</div>
                    <p className="font-bold">Mario, Luigi, Paolo...</p>
                    <p className="text-sm opacity-70">Rating: 70, 85, 60...</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-8">
              <div className="flex-1 text-center md:text-left">
                <div className="badge badge-secondary badge-lg mb-4">Passo 2</div>
                <h3 className="text-3xl font-bold mb-3">Crea Squadre Bilanciate</h3>
                <p className="text-lg text-base-content/70">
                  Seleziona i giocatori disponibili e lascia che l'algoritmo crei squadre perfettamente equilibrate.
                </p>
              </div>
              <div className="flex-1">
                <div className="mockup-window border bg-base-300 shadow-2xl">
                  <div className="bg-base-200 px-4 py-8">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-info/20 p-3 rounded">
                        <p className="font-bold text-info">Squadra A</p>
                        <p className="text-xs">Media: 75</p>
                      </div>
                      <div className="bg-error/20 p-3 rounded">
                        <p className="font-bold text-error">Squadra B</p>
                        <p className="text-xs">Media: 76</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-left">
                <div className="badge badge-accent badge-lg mb-4">Passo 3</div>
                <h3 className="text-3xl font-bold mb-3">Gioca e Vota l'MVP</h3>
                <p className="text-lg text-base-content/70">
                  Inserisci i gol, vota il miglior giocatore e guarda la classifica aggiornarsi automaticamente.
                </p>
              </div>
              <div className="flex-1">
                <div className="mockup-window border bg-base-300 shadow-2xl">
                  <div className="bg-base-200 px-4 py-8 text-center">
                    <div className="text-4xl mb-2">🏆</div>
                    <p className="font-bold">Classifica Aggiornata</p>
                    <p className="text-sm opacity-70">Gol • Vittorie • MVP</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-br from-primary to-secondary text-primary-content">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Pronto a Iniziare?
          </h2>
          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-2xl mx-auto">
            Unisciti a migliaia di organizzatori che stanno già usando Squadra Ideale per i loro tornei.
          </p>
          <Link href="/register" className="btn btn-lg bg-base-100 text-primary hover:bg-base-200 border-none shadow-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Crea il Tuo Primo Torneo
          </Link>
          <p className="mt-4 opacity-75">✨ Gratis • Senza carta di credito</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer footer-center p-10 bg-base-200 text-base-content">
        <div>
          <p className="font-bold text-lg">
            ⚽ Squadra Ideale
          </p>
          <p className="opacity-70">
            Gestisci i tuoi tornei sportivi con facilità
          </p>
          <p className="opacity-60 text-sm mt-2">
            © 2025 - Tutti i diritti riservati
          </p>
        </div>
      </footer>
    </div>
  );
}
