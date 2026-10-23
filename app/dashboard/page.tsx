"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
import { positions } from "@/models/enums";

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  season: number;
  status: string;
  participants?: string[];
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [modal, setModal] = useState<"create" | "join" | null>(null);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [position, setPosition] = useState("Centrocampista");
  const [rating, setRating] = useState(50);
  const [newTournament, setNewTournament] = useState({
    name: "",
    sport: "Calcio",
    season: new Date().getFullYear(),
    description: "",
  });

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/tournaments");
      if (!res.ok) throw new Error();
      setTournaments(await res.json());
    } catch {
      setLoadError(
        "Non riusciamo a caricare i tuoi tornei. Riprova tra un momento.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated") void fetchTournaments();
  }, [status, router, fetchTournaments]);

  const openModal = (next: "create" | "join") => {
    setFormError("");
    setModal(next);
    if (next === "join" && !playerName)
      setPlayerName(session?.user?.name || "");
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setFormError("");
    try {
      const joining = modal === "join";
      const res = await fetch(
        joining ? "/api/tournaments/join" : "/api/tournaments",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            joining
              ? {
                  joinCode: joinCode.trim().toUpperCase(),
                  playerName: playerName.trim(),
                  position,
                  rating,
                }
              : { ...newTournament, name: newTournament.name.trim() },
          ),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setFormError(
          res.status === 401
            ? "La sessione è scaduta. Accedi di nuovo per continuare."
            : joining && res.status === 404
              ? "Codice non trovato. Controlla le 6 lettere e numeri ricevuti dall’organizzatore."
              : joining && res.status === 409
                ? "Fai già parte di questo torneo. Lo trovi nell’elenco dei tuoi tornei."
                : "Operazione non riuscita. Controlla i dati e riprova.",
        );
        return;
      }
      router.push(`/tournaments/${joining ? data.tournament._id : data._id}`);
    } catch {
      setFormError(
        "Connessione interrotta. I tuoi dati sono ancora qui: riprova.",
      );
    } finally {
      setBusy(false);
    }
  };
  const active = tournaments.filter((t) => t.status === "active").length;
  const visible = tournaments.filter(
    (t) =>
      (filter === "all" ||
        (filter === "active"
          ? t.status === "active"
          : t.status !== "active")) &&
      t.name.toLocaleLowerCase("it").includes(query.toLocaleLowerCase("it")),
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <main id="main-content" className="page-width app-main">
        <div className="page-intro">
          <div>
            <p className="eyebrow">IL TUO SPAZIO, LE VOSTRE SFIDE</p>
            <h1>
              {session?.user?.name
                ? `Ciao, ${session.user.name.split(" ")[0]}. Si gioca?`
                : "I tuoi tornei, tutti qui."}
            </h1>
            <p>
              Riprendi un torneo, raggiungi gli amici o dai inizio a una nuova
              sfida.
            </p>
          </div>
          <div className="intro-actions">
            <button
              className="btn btn-outline"
              onClick={() => openModal("join")}
            >
              <Icon name="login" size={17} />
              Ho un codice invito
            </button>
            <button
              className="btn btn-primary"
              onClick={() => openModal("create")}
            >
              <Icon name="plus" size={18} />
              Crea torneo
            </button>
          </div>
        </div>
        <div className="dashboard-summary">
          <div className="summary-item">
            <Icon name="trophy" />
            <strong>{loading ? "–" : tournaments.length}</strong>
            <span>Tornei totali</span>
          </div>
          <div className="summary-item">
            <span className="status-dot" />
            <strong>{loading ? "–" : active}</strong>
            <span>In corso</span>
          </div>
          <div className="summary-item">
            <Icon name="calendar" />
            <strong>{loading ? "–" : tournaments.length - active}</strong>
            <span>Conclusi</span>
          </div>
        </div>
        <div className="dashboard-grid">
          <section className="panel" aria-label="I miei tornei">
            <div className="tournament-toolbar">
              <div
                className="filter-group"
                role="group"
                aria-label="Filtra tornei"
              >
                {[
                  { id: "all", label: "Tutti i tornei" },
                  { id: "active", label: "In corso" },
                  { id: "archived", label: "Conclusi" },
                ].map((item) => (
                  <button
                    key={item.id}
                    className={`filter-button ${filter === item.id ? "selected" : ""}`}
                    aria-pressed={filter === item.id}
                    onClick={() => setFilter(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="search-field">
                <Icon name="search" size={16} />
                <input
                  type="search"
                  aria-label="Cerca tra i tuoi tornei"
                  placeholder="Cerca un torneo…"
                  className="input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            {status === "loading" || loading ? (
              <div className="loading-row" role="status">
                <span className="loading loading-spinner loading-sm" />
                Caricamento dei tuoi tornei…
              </div>
            ) : loadError ? (
              <div className="empty-state" role="alert">
                <p>{loadError}</p>
                <button className="btn btn-outline" onClick={fetchTournaments}>
                  Riprova
                </button>
              </div>
            ) : visible.length ? (
              <div>
                {visible.map((t) => (
                  <Link
                    key={t._id}
                    href={`/tournaments/${t._id}`}
                    className="tournament-row"
                  >
                    <span className="tournament-symbol">
                      <Icon
                        name={t.sport === "Calcio" ? "pitch" : "trophy"}
                        size={25}
                      />
                    </span>
                    <div className="tournament-row-info">
                      <h2>{t.name}</h2>
                      <div className="tournament-meta">
                        <span>{t.sport}</span>
                        <span>
                          <Icon name="calendar" size={12} />
                          {t.season}
                        </span>
                        {t.participants && (
                          <span>
                            <Icon name="users" size={12} />
                            {t.participants.length} giocatori
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`badge ${t.status === "active" ? "badge-success" : "badge-ghost"}`}
                    >
                      {t.status === "active" ? "In corso" : "Concluso"}
                    </span>
                    <Icon name="chevron" size={17} className="row-chevron" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">
                  <Icon name="trophy" size={27} />
                </span>
                <h2>
                  {tournaments.length
                    ? "Nessun torneo trovato"
                    : "La prima sfida inizia da qui."}
                </h2>
                <p>
                  {tournaments.length
                    ? "Prova un altro nome o cambia il filtro per ritrovare il tuo torneo."
                    : "Crea il tuo torneo e invita il gruppo. Se un amico l’ha già creato, ti basta il suo codice invito."}
                </p>
                {tournaments.length ? (
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      setQuery("");
                      setFilter("all");
                    }}
                  >
                    Mostra tutti i tornei
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => openModal("create")}
                  >
                    <Icon name="plus" size={17} />
                    Crea il primo torneo
                  </button>
                )}
              </div>
            )}
          </section>
          <aside className="dashboard-aside">
            <div className="side-card">
              <Icon name="pitch" size={39} />
              <h2>Una partita al volo?</h2>
              <p>
                Non serve un torneo. Aggiungi i giocatori e prepara due squadre
                equilibrate, anche all’ultimo minuto.
              </p>
              <Link href="/balancer" className="btn btn-outline">
                Crea le squadre
                <Icon name="arrow" size={17} />
              </Link>
            </div>
            <div className="dashboard-tip">
              <h3>
                <Icon name="users" size={16} />
                Il gruppo è già pronto?
              </h3>
              <p>
                Trovi il codice invito nella pagina del torneo. Condividilo con
                gli amici per farli partecipare.
              </p>
            </div>
          </aside>
        </div>
        {modal && (
          <Modal
            title={
              modal === "join"
                ? "Entra nel gruppo."
                : "La vostra prossima sfida."
            }
            description={
              modal === "join"
                ? "Inserisci il codice che ti ha inviato l’organizzatore e presenta il tuo giocatore."
                : "Scegli un nome e lo sport. Potrai invitare gli amici appena creato il torneo."
            }
            onClose={() => {
              if (!busy) setModal(null);
            }}
          >
            <form
              onSubmit={handleSubmit}
              className="dialog-form"
              aria-busy={busy}
            >
              {modal === "create" ? (
                <>
                  <div className="form-control">
                    <label htmlFor="tournament-name" className="field-label">
                      Nome del torneo
                    </label>
                    <input
                      id="tournament-name"
                      autoFocus
                      required
                      maxLength={100}
                      className="input"
                      placeholder="Es. Il calcetto del giovedì"
                      value={newTournament.name}
                      onChange={(e) =>
                        setNewTournament({
                          ...newTournament,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="fields-row">
                    <div className="form-control">
                      <label htmlFor="tournament-sport" className="field-label">
                        Sport
                      </label>
                      <select
                        id="tournament-sport"
                        className="select"
                        value={newTournament.sport}
                        onChange={(e) =>
                          setNewTournament({
                            ...newTournament,
                            sport: e.target.value,
                          })
                        }
                      >
                        {["Calcio", "Basket", "Volley"].map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-control">
                      <label
                        htmlFor="tournament-season"
                        className="field-label"
                      >
                        Anno
                      </label>
                      <input
                        id="tournament-season"
                        type="number"
                        min="1900"
                        max="2200"
                        required
                        className="input"
                        value={newTournament.season}
                        onChange={(e) =>
                          setNewTournament({
                            ...newTournament,
                            season: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                  <p className="field-hint">
                    Sarai l’organizzatore e il primo giocatore del torneo. Ruolo
                    e valutazione si possono modificare in seguito.
                  </p>
                </>
              ) : (
                <>
                  <div className="form-control">
                    <label htmlFor="join-code" className="field-label">
                      Codice invito
                    </label>
                    <input
                      id="join-code"
                      autoFocus
                      required
                      minLength={6}
                      maxLength={6}
                      pattern="[A-Za-z0-9]{6}"
                      className="input code-input"
                      placeholder="ABC123"
                      autoComplete="off"
                      value={joinCode}
                      onChange={(e) =>
                        setJoinCode(e.target.value.toUpperCase())
                      }
                    />
                    <p className="field-hint">
                      Le 6 lettere e numeri condivisi dall’organizzatore.
                    </p>
                  </div>
                  <div className="form-control">
                    <label htmlFor="join-name" className="field-label">
                      Il tuo nome in campo
                    </label>
                    <input
                      id="join-name"
                      required
                      maxLength={100}
                      className="input"
                      autoComplete="name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                    />
                  </div>
                  <div className="form-control">
                    <label htmlFor="join-role" className="field-label">
                      Ruolo preferito
                    </label>
                    <select
                      id="join-role"
                      className="select"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                    >
                      {positions.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-control">
                    <label
                      htmlFor="join-rating"
                      className="field-label rating-label"
                    >
                      Valutazione
                      <span className="rating-value">{rating} / 100</span>
                    </label>
                    <input
                      id="join-rating"
                      type="range"
                      min="0"
                      max="100"
                      className="range range-primary range-sm"
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                    />
                    <p className="field-hint">
                      50 è un buon punto di partenza. Serve a bilanciare le
                      squadre.
                    </p>
                  </div>
                </>
              )}
              {formError && (
                <p className="inline-error" role="alert">
                  {formError}
                </p>
              )}
              <div className="dialog-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={busy}
                  onClick={() => setModal(null)}
                >
                  Annulla
                </button>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={
                    busy ||
                    (modal === "create"
                      ? !newTournament.name.trim()
                      : !playerName.trim())
                  }
                >
                  {busy ? (
                    <>
                      <span className="loading loading-spinner loading-xs" />
                      Un momento…
                    </>
                  ) : (
                    <>
                      {modal === "join" ? "Entra nel torneo" : "Crea torneo"}
                      <Icon name="arrow" size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </main>
    </div>
  );
}
