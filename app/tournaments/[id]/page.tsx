"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "../../components/Navbar";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

interface Player {
  _id: string;
  name: string;
  image?: string;
  stats: {
    goals: number;
    mvps: number;
    gamesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    points: number;
  };
}

interface Game {
  _id: string;
  date: string;
  teamA: Player[];
  teamB: Player[];
  goals: { player: string; count: number }[];
  scorer: Player;
  mvp: Player;
  isFinalized: boolean;
}

interface Tournament {
  _id: string;
  name: string;
  participants: Player[];
  games: Game[];
  joinCode: string;
  owner: string;
  status: string;
  currentSeason?: number;
}

interface SeasonStandingRow {
  playerId: string;
  name: string;
  image?: string;
  goals: number;
  mvps: number;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
}

interface SeasonSummary {
  season: number;
  gamesPlayed: number;
  standings: SeasonStandingRow[];
  topScorer: SeasonStandingRow | null;
  topMvp: SeasonStandingRow | null;
  isCurrent: boolean;
}

export default function TournamentDetails() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [loadError, setLoadError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [pastSeasons, setPastSeasons] = useState<SeasonSummary[]>([]);
  const [isLoadingSeasons, setIsLoadingSeasons] = useState(false);
  const [showSeasonHistory, setShowSeasonHistory] = useState(false);

  const fetchTournament = useCallback(async () => {
    setLoadError("");
    try {
      const res = await fetch(`/api/tournaments/${id}`);
      if (!res.ok) throw new Error();
      setTournament(await res.json());
    } catch {
      setLoadError(
        "Non riusciamo a caricare questo torneo. Riprova o torna ai tuoi tornei.",
      );
    }
  }, [id]);

  useEffect(() => {
    if (id) void fetchTournament();
  }, [id, fetchTournament]);

  // Storico stagioni: visibile a chiunque partecipi al torneo (non solo
  // all'owner), caricato solo quando l'utente apre la sezione, per non
  // appesantire il caricamento iniziale della pagina con dati che riguardano
  // solo stagioni passate.
  const fetchSeasonHistory = async () => {
    setIsLoadingSeasons(true);
    const res = await fetch(`/api/tournaments/${id}/seasons`);
    if (res.ok) {
      const data = await res.json();
      // Nella pagina pubblica mostriamo solo le stagioni concluse: quella
      // corrente e' gia' visibile nelle classifiche principali sopra.
      setPastSeasons(
        (data.seasons as SeasonSummary[]).filter((s) => !s.isCurrent),
      );
    }
    setIsLoadingSeasons(false);
  };

  const toggleSeasonHistory = () => {
    const next = !showSeasonHistory;
    setShowSeasonHistory(next);
    if (next && pastSeasons.length === 0) {
      fetchSeasonHistory();
    }
  };

  const copyJoinCode = async () => {
    if (tournament?.joinCode) {
      try {
        await navigator.clipboard.writeText(tournament.joinCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
        setNotification({
          type: "error",
          message: "Impossibile copiare il codice",
        });
      }
    }
  };

  const handleDeactivateTournament = async () => {
    setIsDeactivating(true);
    try {
      const res = await fetch(`/api/tournaments/${id}/deactivate`, {
        method: "POST",
      });

      if (res.ok) {
        setNotification({
          type: "success",
          message: "Torneo disattivato con successo!",
        });
        setShowDeactivateModal(false);
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      } else {
        const error = await res.json();
        setNotification({
          type: "error",
          message: error.message || "Errore nella disattivazione",
        });
      }
    } catch (error) {
      setNotification({ type: "error", message: "Errore di connessione" });
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleLeaveTournament = async () => {
    setIsLeaving(true);
    try {
      const res = await fetch(`/api/tournaments/${id}/leave`, {
        method: "POST",
      });

      if (res.ok) {
        setNotification({
          type: "success",
          message: "Hai lasciato il torneo con successo!",
        });
        setShowLeaveModal(false);
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      } else {
        const error = await res.json();
        setNotification({
          type: "error",
          message: error.message || "Errore nell'uscita dal torneo",
        });
      }
    } catch (error) {
      setNotification({ type: "error", message: "Errore di connessione" });
    } finally {
      setIsLeaving(false);
    }
  };

  const handleReactivateTournament = async () => {
    setIsReactivating(true);
    try {
      const res = await fetch(`/api/tournaments/${id}/reactivate`, {
        method: "POST",
      });

      if (res.ok) {
        setNotification({
          type: "success",
          message: "Torneo riattivato con successo!",
        });
        setShowReactivateModal(false);
        fetchTournament(); // Refresh tournament data
        setTimeout(() => setNotification(null), 3000);
      } else {
        const error = await res.json();
        setNotification({
          type: "error",
          message: error.message || "Errore nella riattivazione",
        });
      }
    } catch (error) {
      setNotification({ type: "error", message: "Errore di connessione" });
    } finally {
      setIsReactivating(false);
    }
  };

  if (!tournament)
    return (
      <div className="min-h-screen">
        <Navbar />
        <main id="main-content" className="page-width app-main">
          {loadError ? (
            <div className="empty-state" role="alert">
              <span className="empty-icon">
                <Icon name="trophy" size={28} />
              </span>
              <h1>Torneo non disponibile</h1>
              <p>{loadError}</p>
              <button className="btn btn-outline" onClick={fetchTournament}>
                Riprova
              </button>
              <Link href="/dashboard" className="breadcrumb-link">
                Torna ai tuoi tornei
              </Link>
            </div>
          ) : (
            <div className="loading-row" role="status">
              <span className="loading loading-spinner loading-sm" />
              Caricamento del torneo…
            </div>
          )}
        </main>
      </div>
    );
  const isOwner =
    (session?.user as { id?: string } | undefined)?.id === tournament.owner;

  // Calculate standings dynamically or use stored stats
  const sortedPlayers = [...tournament.participants].sort((a, b) => {
    // Sort by points, then goals, then MVPs
    if (b.stats.points !== a.stats.points)
      return b.stats.points - a.stats.points;
    if (b.stats.goals !== a.stats.goals) return b.stats.goals - a.stats.goals;
    return b.stats.mvps - a.stats.mvps;
  });

  const topScorers = [...tournament.participants]
    .filter((p) => p.stats?.goals > 0)
    .sort((a, b) => b.stats.goals - a.stats.goals);

  const topMVPs = [...tournament.participants]
    .filter((p) => p.stats?.mvps > 0)
    .sort((a, b) => b.stats.mvps - a.stats.mvps);

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
      <main id="main-content" className="container mx-auto p-6">
        {/* Notifications */}
        {notification && (
          <div className="toast toast-top toast-end z-50" role="status">
            <div
              className={`alert ${notification.type === "success" ? "alert-success" : "alert-error"}`}
            >
              <span>{notification.message}</span>
            </div>
          </div>
        )}

        <header className="tournament-header">
          <Link href="/dashboard" className="breadcrumb-link">
            <Icon name="back" size={15} />I miei tornei
          </Link>
          <div className="tournament-title-row">
            <div>
              <p className="eyebrow">IL VOSTRO TORNEO</p>
              <h1>{tournament.name}</h1>
              <p className="tournament-subtitle">
                <span>Stagione {tournament.currentSeason || 1}</span>
                <span>{tournament.participants.length} giocatori</span>
                <span
                  className={`badge ${tournament.status === "completed" ? "badge-ghost" : "badge-success"}`}
                >
                  {tournament.status === "completed" ? "Concluso" : "In corso"}
                </span>
              </p>
            </div>
            <div className="tournament-actions">
              {tournament.status === "completed" ? (
                isOwner && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowReactivateModal(true)}
                  >
                    Riattiva torneo
                    <Icon name="arrow" size={16} />
                  </button>
                )
              ) : (
                <>
                  <Link
                    href={`/tournaments/${id}/play`}
                    className="btn btn-primary"
                  >
                    <Icon name="plus" size={17} />
                    Prepara una partita
                  </Link>
                  {isOwner && (
                    <Link
                      href={`/tournaments/${id}/admin`}
                      className="btn btn-outline"
                    >
                      <Icon name="settings" size={17} />
                      Gestisci
                    </Link>
                  )}
                  <details className="tournament-more">
                    <summary className="btn btn-ghost">
                      Altro
                      <Icon name="down" size={14} />
                    </summary>
                    <div className="tournament-more-menu">
                      {isOwner ? (
                        <button
                          className="text-error"
                          onClick={() => setShowDeactivateModal(true)}
                        >
                          Concludi torneo
                        </button>
                      ) : (
                        <button onClick={() => setShowLeaveModal(true)}>
                          Lascia il torneo
                        </button>
                      )}
                    </div>
                  </details>
                </>
              )}
            </div>
          </div>
        </header>
        {loadError && (
          <p className="alert alert-error mb-5" role="alert">
            {loadError}
          </p>
        )}
        <section className="invite-panel" aria-label="Invita i tuoi amici">
          <div>
            <h2>Il gruppo si allarga.</h2>
            <p>
              Condividi questo codice. Gli amici possono inserirlo da «Ho un
              codice invito».
            </p>
          </div>
          <div className="invite-code">
            <code>{tournament.joinCode}</code>
            <button className="btn btn-outline" onClick={copyJoinCode}>
              <Icon name={copied ? "check" : "users"} size={16} />
              {copied ? "Codice copiato" : "Copia codice"}
            </button>
            <span className="sr-only" role="status">
              {copied ? "Codice invito copiato negli appunti" : ""}
            </span>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Standings */}
          <div className="lg:col-span-2 card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-1">Classifica generale</h2>
              <p className="field-hint mb-3">
                Ordinata per punti, poi gol e premi MVP.
              </p>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Giocatore</th>
                      <th className="text-center">Punti</th>
                      <th className="text-center">
                        <abbr title="Vittorie">V</abbr>
                      </th>
                      <th className="text-center">
                        <abbr title="Pareggi">P</abbr>
                      </th>
                      <th className="text-center">
                        <abbr title="Sconfitte">S</abbr>
                      </th>
                      <th className="text-center">Gol</th>
                      <th className="text-center">MVP</th>
                      <th className="text-center">Partite Giocate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPlayers.map((player, index) => (
                      <tr key={player._id}>
                        <td className="font-bold text-primary">#{index + 1}</td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar">
                              <div className="w-10 h-10 rounded-full">
                                {player.image ? (
                                  <img src={player.image} alt={player.name} />
                                ) : (
                                  <div className="bg-secondary text-secondary-content rounded-full w-10 h-10 flex items-center justify-center">
                                    <span className="text-sm font-bold">
                                      {player.name
                                        .substring(0, 2)
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="font-medium">{player.name}</span>
                          </div>
                        </td>
                        <td className="text-center font-bold text-success">
                          {player.stats.points || 0}
                        </td>
                        <td className="text-center">
                          {player.stats.wins || 0}
                        </td>
                        <td className="text-center">
                          {player.stats.draws || 0}
                        </td>
                        <td className="text-center">
                          {player.stats.losses || 0}
                        </td>
                        <td className="text-center">
                          {player.stats.goals || 0}
                        </td>
                        <td className="text-center">
                          {player.stats.mvps || 0}
                        </td>
                        <td className="text-center">
                          {player.stats.gamesPlayed || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Games */}
          <div className="card bg-base-100 shadow-xl h-fit">
            <div className="card-body">
              <h2 className="card-title mb-4">Partite Recenti</h2>
              <div className="space-y-4">
                {tournament.games.length === 0 ? (
                  <p className="text-gray-500 italic">
                    Nessuna partita giocata ancora.
                  </p>
                ) : (
                  tournament.games.map((game) => (
                    <div key={game._id} className="alert alert-info shadow-sm">
                      <div className="flex flex-col w-full">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-xs opacity-70 px-2">
                            {new Date(game.date).toLocaleDateString("it-IT")}
                          </div>
                          {session?.user && !game.isFinalized && (
                            <Link
                              href={`/games/${game._id}`}
                              className="btn btn-sm btn-outline"
                            >
                              {isOwner ? "Gestisci partita" : "Apri partita"}
                              <Icon name="chevron" size={13} />
                            </Link>
                          )}
                        </div>
                        <div className="flex justify-between items-center w-full">
                          <span className="font-bold px-2">MVP</span>
                          <span className="px-2">
                            {game.mvp?.name || "In attesa"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Leaderboards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {/* Top Scorers */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-4">Cannonieri</h2>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Giocatore</th>
                      <th className="text-center">Gol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topScorers.length > 0 ? (
                      topScorers.map((player, index) => (
                        <tr key={player._id}>
                          <td className="font-bold text-primary">
                            #{index + 1}
                          </td>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="avatar">
                                <div className="w-8 h-8 rounded-full">
                                  {player.image ? (
                                    <img src={player.image} alt={player.name} />
                                  ) : (
                                    <div className="bg-secondary text-secondary-content rounded-full w-8 h-8 flex items-center justify-center">
                                      <span className="text-xs font-bold">
                                        {player.name
                                          .substring(0, 2)
                                          .toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span className="font-medium">{player.name}</span>
                            </div>
                          </td>
                          <td className="text-center font-bold text-success">
                            {player.stats.goals}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="text-center text-gray-500 italic"
                        >
                          Nessun gol segnato ancora.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Top MVPs */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-4">Migliori in campo</h2>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Giocatore</th>
                      <th className="text-center">MVP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topMVPs.length > 0 ? (
                      topMVPs.map((player, index) => (
                        <tr key={player._id}>
                          <td className="font-bold text-primary">
                            #{index + 1}
                          </td>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="avatar">
                                <div className="w-8 h-8 rounded-full">
                                  {player.image ? (
                                    <img src={player.image} alt={player.name} />
                                  ) : (
                                    <div className="bg-secondary text-secondary-content rounded-full w-8 h-8 flex items-center justify-center">
                                      <span className="text-xs font-bold">
                                        {player.name
                                          .substring(0, 2)
                                          .toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span className="font-medium">{player.name}</span>
                            </div>
                          </td>
                          <td className="text-center font-bold text-warning">
                            {player.stats.mvps}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="text-center text-gray-500 italic"
                        >
                          Nessun MVP assegnato ancora.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Storico Stagioni - visibile a tutti i partecipanti, non solo all'owner */}
        <div className="card bg-base-100 shadow-xl mt-8">
          <div className="card-body">
            <button
              onClick={toggleSeasonHistory}
              aria-expanded={showSeasonHistory}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="card-title">Storico Stagioni</h2>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 transition-transform ${showSeasonHistory ? "rotate-180" : ""}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {showSeasonHistory && (
              <div className="mt-4 space-y-4">
                {isLoadingSeasons ? (
                  <span className="loading loading-spinner"></span>
                ) : pastSeasons.length === 0 ? (
                  <p className="text-gray-500 italic">
                    Nessuna stagione passata: la Stagione{" "}
                    {tournament.currentSeason || 1} è ancora in corso.
                  </p>
                ) : (
                  pastSeasons.map((s) => (
                    <div
                      key={s.season}
                      className="collapse collapse-arrow bg-base-200"
                    >
                      <input type="checkbox" />
                      <div className="collapse-title font-bold">
                        Stagione {s.season}
                        <span className="text-sm font-normal opacity-70 ml-2">
                          ({s.gamesPlayed} partite)
                        </span>
                      </div>
                      <div className="collapse-content">
                        <div className="flex flex-wrap gap-6 mb-3 text-sm">
                          <div>
                            Capocannoniere:{" "}
                            <strong>
                              {s.topScorer
                                ? `${s.topScorer.name} (${s.topScorer.goals})`
                                : "N/A"}
                            </strong>
                          </div>
                          <div>
                            MVP stagione:{" "}
                            <strong>
                              {s.topMvp
                                ? `${s.topMvp.name} (${s.topMvp.mvps})`
                                : "N/A"}
                            </strong>
                          </div>
                          <div>
                            Vincitore:{" "}
                            <strong>{s.standings[0]?.name || "N/A"}</strong>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="table table-sm w-full">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Giocatore</th>
                                <th>Pt</th>
                                <th>V</th>
                                <th>P</th>
                                <th>S</th>
                                <th>Gol</th>
                                <th>MVP</th>
                              </tr>
                            </thead>
                            <tbody>
                              {s.standings.map((row, idx) => (
                                <tr key={row.playerId}>
                                  <td>{idx + 1}</td>
                                  <td>{row.name}</td>
                                  <td className="font-bold">{row.points}</td>
                                  <td>{row.wins}</td>
                                  <td>{row.draws}</td>
                                  <td>{row.losses}</td>
                                  <td>{row.goals}</td>
                                  <td>{row.mvps}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {showDeactivateModal && (
          <Modal
            title="Concludi il torneo?"
            description="Il torneo resterà consultabile e non si potranno creare nuove partite. Potrai riattivarlo in seguito."
            onClose={() => {
              if (!isDeactivating) setShowDeactivateModal(false);
            }}
          >
            <div className="dialog-form">
              <div className="dialog-actions">
                <button
                  className="btn btn-ghost"
                  disabled={isDeactivating}
                  onClick={() => setShowDeactivateModal(false)}
                >
                  Annulla
                </button>
                <button
                  className="btn btn-primary"
                  disabled={isDeactivating}
                  onClick={handleDeactivateTournament}
                >
                  {isDeactivating ? "Un momento…" : "Concludi torneo"}
                </button>
              </div>
            </div>
          </Modal>
        )}
        {showReactivateModal && (
          <Modal
            title="Si torna in campo?"
            description="Riattiva il torneo per preparare nuove partite con il tuo gruppo."
            onClose={() => {
              if (!isReactivating) setShowReactivateModal(false);
            }}
          >
            <div className="dialog-form">
              <div className="dialog-actions">
                <button
                  className="btn btn-ghost"
                  disabled={isReactivating}
                  onClick={() => setShowReactivateModal(false)}
                >
                  Annulla
                </button>
                <button
                  className="btn btn-primary"
                  disabled={isReactivating}
                  onClick={handleReactivateTournament}
                >
                  {isReactivating ? "Un momento…" : "Riattiva torneo"}
                </button>
              </div>
            </div>
          </Modal>
        )}
        {showLeaveModal && (
          <Modal
            title="Vuoi lasciare il torneo?"
            description="Le tue statistiche saranno conservate, ma non potrai partecipare alle nuove partite."
            onClose={() => {
              if (!isLeaving) setShowLeaveModal(false);
            }}
          >
            <div className="dialog-form">
              <div className="dialog-actions">
                <button
                  className="btn btn-ghost"
                  disabled={isLeaving}
                  onClick={() => setShowLeaveModal(false)}
                >
                  Resta nel gruppo
                </button>
                <button
                  className="btn btn-error"
                  disabled={isLeaving}
                  onClick={handleLeaveTournament}
                >
                  {isLeaving ? "Un momento…" : "Lascia il torneo"}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
}
