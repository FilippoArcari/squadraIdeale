"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "../../../components/Navbar";
import Link from "next/link";
import Icon from "@/components/Icon";

interface Player {
  _id: string;
  name: string;
  position: string;
  rating: number;
  image?: string;
}

interface Game {
  _id: string;
  date: string;
  teamA: Player[];
  teamB: Player[];
  goals: { player: string; count: number }[];
  mvp?: Player;
  manualWinner?: "teamA" | "teamB" | "draw";
  isFinalized?: boolean;
}

interface Tournament {
  _id: string;
  name: string;
  owner: string;
  admins: Player[];
  participants: Player[];
  games: Game[];
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

export default function AdminDashboard() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [activeTab, setActiveTab] = useState<
    "players" | "games" | "points" | "seasons"
  >("players");
  const [isLoading, setIsLoading] = useState(true);

  // Stagioni
  const [seasonHistory, setSeasonHistory] = useState<SeasonSummary[]>([]);
  const [isLoadingSeasons, setIsLoadingSeasons] = useState(false);
  const [isStartingSeason, setIsStartingSeason] = useState(false);
  const [seasonActionMessage, setSeasonActionMessage] = useState<string | null>(
    null,
  );

  // Regole punti (versionate per stagione)
  const [pointsRule, setPointsRule] = useState<{
    winner: number;
    loser: number;
    draw: number;
    absent: number;
  } | null>(null);
  const [pointsRuleForm, setPointsRuleForm] = useState({
    winner: 3,
    loser: 0,
    draw: 1,
    absent: 0,
  });
  const [isSavingPointsRule, setIsSavingPointsRule] = useState(false);
  const [pointsRuleMessage, setPointsRuleMessage] = useState<string | null>(
    null,
  );

  // Edit States
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>("");
  const [newRating, setNewRating] = useState<number>(50);
  const [newPosition, setNewPosition] = useState<string>("Attaccante");
  const [newImage, setNewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [gameForm, setGameForm] = useState<{
    date: string;
    goals: { [key: string]: number };
    mvp: string;
    manualWinner: "teamA" | "teamB" | "draw" | "";
  }>({ date: "", goals: {}, mvp: "", manualWinner: "" });

  const [editingPoints, setEditingPoints] = useState<string | null>(null);
  const [newPoints, setNewPoints] = useState<number>(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (id && status === "authenticated") {
      fetchTournament();
    }
  }, [id, status]);

  const fetchTournament = async () => {
    setIsLoading(true);
    const res = await fetch(`/api/tournaments/${id}`);
    if (res.ok) {
      const data = await res.json();
      // Verify owner
      if (session?.user && (session.user as any).id !== data.owner) {
        router.push(`/tournaments/${id}`); // Redirect non-owners
        return;
      }
      setTournament(data);
    }
    setIsLoading(false);
  };

  const fetchSeasonHistory = async () => {
    setIsLoadingSeasons(true);
    const res = await fetch(`/api/tournaments/${id}/seasons`);
    if (res.ok) {
      const data = await res.json();
      setSeasonHistory(data.seasons);
    }
    setIsLoadingSeasons(false);
  };

  const fetchPointsRule = async () => {
    const res = await fetch(`/api/tournaments/${id}/points-rules`);
    if (res.ok) {
      const data = await res.json();
      setPointsRule(data.currentRule);
      setPointsRuleForm({
        winner: data.currentRule.winner,
        loser: data.currentRule.loser,
        draw: data.currentRule.draw,
        absent: data.currentRule.absent,
      });
    }
  };

  useEffect(() => {
    if (activeTab === "seasons" && id && status === "authenticated") {
      fetchSeasonHistory();
      fetchPointsRule();
    }
  }, [activeTab, id, status]);

  const handleSavePointsRule = async () => {
    if (!tournament) return;
    if (
      !confirm(
        `La nuova regola punti si applichera' dalla Stagione ${tournament.currentSeason || 1} in poi. ` +
          `Le stagioni precedenti, gia' chiuse, resteranno invariate con la loro regola originale. Continuare?`,
      )
    ) {
      return;
    }

    setIsSavingPointsRule(true);
    setPointsRuleMessage(null);
    try {
      const res = await fetch(`/api/tournaments/${id}/points-rules`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pointsRuleForm),
      });
      if (res.ok) {
        setPointsRuleMessage("Regola punti aggiornata.");
        await fetchPointsRule();
        await fetchSeasonHistory();
      } else {
        const error = await res.json();
        setPointsRuleMessage(
          error.message || "Errore nel salvataggio della regola punti.",
        );
      }
    } catch (error) {
      setPointsRuleMessage("Errore di connessione.");
    } finally {
      setIsSavingPointsRule(false);
    }
  };

  const handleStartNewSeason = async () => {
    if (!tournament) return;
    const nextSeason = (tournament.currentSeason || 1) + 1;
    if (
      !confirm(
        `Sei sicuro di voler avviare la Stagione ${nextSeason}?\n\n` +
          `La Stagione ${tournament.currentSeason || 1} verra' congelata nello storico (visibile a tutti i partecipanti) ` +
          `e le classifiche in "/tournaments" ripartiranno da zero per la nuova stagione. ` +
          `Il rating dei giocatori NON viene toccato. Questa azione non e' reversibile.`,
      )
    ) {
      return;
    }

    setIsStartingSeason(true);
    setSeasonActionMessage(null);
    try {
      const res = await fetch(`/api/tournaments/${id}/seasons`, {
        method: "POST",
      });
      if (res.ok) {
        setSeasonActionMessage(`Stagione ${nextSeason} avviata con successo.`);
        await fetchTournament();
        await fetchSeasonHistory();
      } else {
        const error = await res.json();
        setSeasonActionMessage(
          error.message || "Errore nell'avvio della nuova stagione.",
        );
      }
    } catch (error) {
      setSeasonActionMessage("Errore di connessione.");
    } finally {
      setIsStartingSeason(false);
    }
  };

  // Player Actions
  const handleUpdatePlayer = async (playerId: string) => {
    setIsUploading(true);
    const res = await fetch(`/api/tournaments/${id}/players/${playerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        rating: newRating,
        position: newPosition,
        image: newImage,
      }),
    });

    setIsUploading(false);
    if (res.ok) {
      setEditingPlayer(null);
      setNewImage(null);
      fetchTournament();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!confirm("Sei sicuro di voler rimuovere questo giocatore?")) return;

    const res = await fetch(`/api/tournaments/${id}/players/${playerId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      fetchTournament();
    }
  };

  // Game Actions
  const openGameModal = (game: Game) => {
    setEditingGame(game);
    const goalsMap: { [key: string]: number } = {};
    game.goals.forEach((g) => (goalsMap[g.player] = g.count));

    setGameForm({
      date: game.date.split("T")[0],
      goals: goalsMap,
      mvp: game.mvp?._id || "",
      manualWinner: game.manualWinner || "",
    });

    // Open modal
    (document.getElementById("game_modal") as HTMLDialogElement).showModal();
  };

  const handleUpdateGame = async () => {
    if (!editingGame) return;

    // Transform goals map back to array
    const goalsArray = Object.entries(gameForm.goals).map(
      ([player, count]) => ({
        player,
        count,
      }),
    );

    const res = await fetch(`/api/games/${editingGame._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: gameForm.date,
        goals: goalsArray,
        mvp: gameForm.mvp || null,
        manualWinner: gameForm.manualWinner || null,
      }),
    });

    if (res.ok) {
      (document.getElementById("game_modal") as HTMLDialogElement).close();
      setEditingGame(null);
      fetchTournament();
    }
  };

  const handleDeleteGame = async (game: Game) => {
    const finalized = game.isFinalized
      ? "\n\nLa partita è già conclusa: gol, MVP, vittorie e punti assegnati ai giocatori verranno annullati."
      : "";
    if (
      !confirm(
        `Eliminare la partita del ${new Date(game.date).toLocaleDateString("it-IT")}? L'azione non si può annullare.${finalized}`,
      )
    )
      return;

    const res = await fetch(`/api/games/${game._id}`, { method: "DELETE" });
    if (res.ok) {
      fetchTournament();
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.message || "Impossibile eliminare la partita.");
    }
  };

  const handleUpdatePoints = async (playerId: string) => {
    const res = await fetch(
      `/api/tournaments/${id}/players/${playerId}/points`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: newPoints }),
      },
    );
    if (res.ok) {
      setEditingPoints(null);
      fetchTournament();
    }
  };

  const handlePromoteAdmin = async (playerId: string) => {
    if (!confirm("Sei sicuro di voler promuovere questo giocatore ad admin?"))
      return;

    const res = await fetch(`/api/tournaments/${id}/admins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    if (res.ok) {
      fetchTournament();
    }
  };

  const handleDemoteAdmin = async (playerId: string) => {
    if (
      !confirm(
        "Sei sicuro di voler rimuovere i privilegi admin da questo giocatore?",
      )
    )
      return;

    const res = await fetch(`/api/tournaments/${id}/admins`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    if (res.ok) {
      fetchTournament();
    }
  };

  if (isLoading || !tournament)
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
      <main id="main-content" className="container mx-auto p-6">
        <Link href={`/tournaments/${id}`} className="breadcrumb-link">
          <Icon name="back" size={15} />
          Torna al torneo
        </Link>
        <div className="page-intro">
          <div>
            <p className="eyebrow">GESTIONE DEL TORNEO</p>
            <h1>{tournament.name}</h1>
            <p>
              Giocatori, risultati, punteggi e stagioni. Tutto sotto controllo.
            </p>
          </div>
        </div>
        <div
          className="admin-section-nav"
          role="group"
          aria-label="Sezioni di gestione"
        >
          {(
            [
              { id: "players", label: "Giocatori", icon: "users" },
              { id: "games", label: "Partite", icon: "pitch" },
              { id: "points", label: "Regole e punti", icon: "chart" },
              { id: "seasons", label: "Stagioni", icon: "calendar" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`admin-section-button ${activeTab === tab.id ? "selected" : ""}`}
              aria-pressed={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon name={tab.icon} size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "players" && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-4">Gestione Giocatori</h2>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Posizione</th>
                      <th>Rating</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournament.participants.map((player) => (
                      <tr key={player._id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar relative">
                              <div className="w-10 h-10 rounded-full">
                                {editingPlayer === player._id && newImage ? (
                                  <img src={newImage} alt={player.name} />
                                ) : player.image ? (
                                  <img src={player.image} alt={player.name} />
                                ) : (
                                  <div className="bg-secondary text-secondary-content rounded-full w-10 h-10 flex items-center justify-center">
                                    <span className="text-sm">
                                      {player.name
                                        .substring(0, 2)
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {editingPlayer === player._id && (
                                <label className="absolute -bottom-2 -right-2 btn btn-xs btn-circle btn-primary cursor-pointer text-white">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                  />
                                </label>
                              )}
                            </div>
                            {editingPlayer === player._id ? (
                              <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="input input-xs input-primary w-24 font-bold"
                              />
                            ) : (
                              <span className="font-bold">{player.name}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          {editingPlayer === player._id ? (
                            <select
                              className="select select-bordered select-xs w-full max-w-xs"
                              value={newPosition}
                              onChange={(e) => setNewPosition(e.target.value)}
                            >
                              <option value="Portiere">Portiere</option>
                              <option value="Difensore">Difensore</option>
                              <option value="Centrocampista">
                                Centrocampista
                              </option>
                              <option value="Attaccante">Attaccante</option>
                            </select>
                          ) : (
                            player.position
                          )}
                        </td>
                        <td>
                          {editingPlayer === player._id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={newRating}
                                onChange={(e) =>
                                  setNewRating(parseInt(e.target.value || "0"))
                                }
                                className="input input-xs input-primary w-24"
                              />
                              <span className="text-xs font-bold w-6">
                                {newRating}
                              </span>
                              <button
                                onClick={() => handleUpdatePlayer(player._id)}
                                className="btn btn-xs btn-success btn-square"
                                disabled={isUploading}
                              >
                                {isUploading ? (
                                  <span className="loading loading-spinner loading-xs"></span>
                                ) : (
                                  "✓"
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingPlayer(null);
                                  setNewImage(null);
                                }}
                                className="btn btn-xs btn-ghost btn-square"
                                disabled={isUploading}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="badge badge-outline">
                                {player.rating}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingPlayer(player._id);
                                  setNewName(player.name);
                                  setNewRating(player.rating);
                                  setNewPosition(
                                    player.position || "Attaccante",
                                  );
                                  setNewImage(player.image || null);
                                }}
                                className="btn btn-xs btn-ghost opacity-50 hover:opacity-100"
                              >
                                ✎
                              </button>
                            </div>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => handleRemovePlayer(player._id)}
                            className="btn btn-xs btn-error btn-outline"
                            disabled={
                              (session?.user as any).id === tournament.owner &&
                              player.name === session?.user?.name
                            } // Prevent owner removing themselves roughly
                          >
                            Rimuovi
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "points" && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-4">Gestione Punti</h2>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Punti Attuali</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournament.participants.map((player) => (
                      <tr key={player._id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar">
                              <div className="w-10 h-10 rounded-full">
                                {player.image ? (
                                  <img src={player.image} alt={player.name} />
                                ) : (
                                  <div className="bg-secondary text-secondary-content rounded-full w-10 h-10 flex items-center justify-center">
                                    <span className="text-sm">
                                      {player.name
                                        .substring(0, 2)
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="font-bold">{player.name}</span>
                          </div>
                        </td>
                        <td>
                          {editingPoints === player._id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={newPoints}
                                onChange={(e) =>
                                  setNewPoints(parseInt(e.target.value || "0"))
                                }
                                className="input input-xs input-primary w-24"
                              />
                              <button
                                onClick={() => handleUpdatePoints(player._id)}
                                className="btn btn-xs btn-success btn-square"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setEditingPoints(null)}
                                className="btn btn-xs btn-ghost btn-square"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="badge badge-lg badge-success">
                                {(player as any).stats?.points || 0}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingPoints(player._id);
                                  setNewPoints(
                                    (player as any).stats?.points || 0,
                                  );
                                }}
                                className="btn btn-xs btn-ghost opacity-50 hover:opacity-100"
                              >
                                ✎
                              </button>
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="text-sm text-gray-500">
                            V: {(player as any).stats?.wins || 0} | P:{" "}
                            {(player as any).stats?.draws || 0} | S:{" "}
                            {(player as any).stats?.losses || 0}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "games" && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-4">Gestione Partite</h2>
              <div className="space-y-4">
                {tournament.games.map((game) => (
                  <div
                    key={game._id}
                    className="alert bg-base-200 shadow-sm flex justify-between items-center"
                  >
                    <div>
                      <div className="font-bold text-sm opacity-70">
                        {new Date(game.date).toLocaleDateString()}
                      </div>
                      <div className="text-lg">
                        {game.teamA.length} vs {game.teamB.length} Giocatori
                      </div>
                      <div className="text-xs mt-1">
                        MVP: {game.mvp?.name || "N/A"} | Vincitore:{" "}
                        {game.manualWinner || "Auto"}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openGameModal(game)}
                        className="btn btn-sm btn-primary"
                      >
                        Modifica
                      </button>
                      <button
                        onClick={() => handleDeleteGame(game)}
                        className="btn btn-sm btn-outline btn-error"
                      >
                        Elimina
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "seasons" && (
          <div className="space-y-6">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-2">
                  Stagione Corrente: {tournament.currentSeason || 1}
                </h2>
                <p className="text-sm opacity-70 mb-4">
                  Avviando una nuova stagione, la Stagione{" "}
                  {tournament.currentSeason || 1} resta consultabile nello
                  storico (sotto, visibile anche a tutti i partecipanti dalla
                  pagina del torneo) mentre le classifiche correnti ripartono da
                  zero. Il rating dei giocatori non viene modificato.
                </p>
                {seasonActionMessage && (
                  <div className="alert alert-info mb-4 text-sm">
                    {seasonActionMessage}
                  </div>
                )}
                <div>
                  <button
                    onClick={handleStartNewSeason}
                    disabled={isStartingSeason}
                    className="btn btn-warning"
                  >
                    {isStartingSeason
                      ? "Avvio in corso..."
                      : `Avvia Stagione ${(tournament.currentSeason || 1) + 1}`}
                  </button>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-2">Regole Punti</h2>
                <p className="text-sm opacity-70 mb-4">
                  Cambiando questi valori, la nuova regola si applica dalla
                  Stagione {tournament.currentSeason || 1} (quella corrente) in
                  poi. Le stagioni gia' chiuse restano ancorate alla regola con
                  cui sono state giocate.
                </p>
                {pointsRuleMessage && (
                  <div className="alert alert-info mb-4 text-sm">
                    {pointsRuleMessage}
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Vittoria</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={pointsRuleForm.winner}
                      onChange={(e) =>
                        setPointsRuleForm({
                          ...pointsRuleForm,
                          winner: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Sconfitta</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={pointsRuleForm.loser}
                      onChange={(e) =>
                        setPointsRuleForm({
                          ...pointsRuleForm,
                          loser: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Pareggio</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={pointsRuleForm.draw}
                      onChange={(e) =>
                        setPointsRuleForm({
                          ...pointsRuleForm,
                          draw: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Assente</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={pointsRuleForm.absent}
                      onChange={(e) =>
                        setPointsRuleForm({
                          ...pointsRuleForm,
                          absent: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                {pointsRule && (
                  <p className="text-xs opacity-60 mb-4">
                    Regola attualmente in vigore: {pointsRule.winner} vittoria /{" "}
                    {pointsRule.loser} sconfitta / {pointsRule.draw} pareggio /{" "}
                    {pointsRule.absent} assente.
                  </p>
                )}
                <div>
                  <button
                    onClick={handleSavePointsRule}
                    disabled={isSavingPointsRule}
                    className="btn btn-primary"
                  >
                    {isSavingPointsRule
                      ? "Salvataggio..."
                      : "Salva Regola Punti"}
                  </button>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">Storico Stagioni</h2>
                {isLoadingSeasons ? (
                  <span className="loading loading-spinner"></span>
                ) : seasonHistory.length === 0 ? (
                  <p className="text-gray-500 italic">
                    Nessuna stagione trovata.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {seasonHistory.map((s) => (
                      <div
                        key={s.season}
                        className="collapse collapse-arrow bg-base-200"
                      >
                        <input type="checkbox" defaultChecked={s.isCurrent} />
                        <div className="collapse-title font-bold">
                          Stagione {s.season}{" "}
                          {s.isCurrent && (
                            <span className="badge badge-success ml-2">
                              In corso
                            </span>
                          )}
                          <span className="text-sm font-normal opacity-70 ml-2">
                            ({s.gamesPlayed} partite)
                          </span>
                        </div>
                        <div className="collapse-content">
                          <div className="flex gap-6 mb-3 text-sm">
                            <div>
                              🥇 Capocannoniere:{" "}
                              <strong>
                                {s.topScorer
                                  ? `${s.topScorer.name} (${s.topScorer.goals})`
                                  : "N/A"}
                              </strong>
                            </div>
                            <div>
                              🏅 MVP Stagione:{" "}
                              <strong>
                                {s.topMvp
                                  ? `${s.topMvp.name} (${s.topMvp.mvps})`
                                  : "N/A"}
                              </strong>
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
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Game Edit Modal */}
        <dialog id="game_modal" className="modal">
          <div className="modal-box w-11/12 max-w-3xl">
            <h3 className="font-bold text-lg mb-4">Modifica Partita</h3>

            {editingGame && (
              <div className="space-y-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Data</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered"
                    value={gameForm.date}
                    onChange={(e) =>
                      setGameForm({ ...gameForm, date: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-bold mb-2 text-info">Squadra A</h4>
                    {editingGame.teamA.map((p) => (
                      <div
                        key={p._id}
                        className="flex justify-between items-center mb-2"
                      >
                        <span className="text-sm">{p.name}</span>
                        <input
                          type="number"
                          className="input input-bordered input-xs w-16"
                          value={gameForm.goals[p._id] || 0}
                          onChange={(e) =>
                            setGameForm({
                              ...gameForm,
                              goals: {
                                ...gameForm.goals,
                                [p._id]: parseInt(e.target.value) || 0,
                              },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="font-bold mb-2 text-error">Squadra B</h4>
                    {editingGame.teamB.map((p) => (
                      <div
                        key={p._id}
                        className="flex justify-between items-center mb-2"
                      >
                        <span className="text-sm">{p.name}</span>
                        <input
                          type="number"
                          className="input input-bordered input-xs w-16"
                          value={gameForm.goals[p._id] || 0}
                          onChange={(e) =>
                            setGameForm({
                              ...gameForm,
                              goals: {
                                ...gameForm.goals,
                                [p._id]: parseInt(e.target.value) || 0,
                              },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">MVP</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={gameForm.mvp}
                    onChange={(e) =>
                      setGameForm({ ...gameForm, mvp: e.target.value })
                    }
                  >
                    <option value="" disabled>
                      Seleziona MVP
                    </option>
                    {[...editingGame.teamA, ...editingGame.teamB].map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Vincitore Manuale</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={gameForm.manualWinner}
                    onChange={(e) =>
                      setGameForm({
                        ...gameForm,
                        manualWinner: e.target.value as any,
                      })
                    }
                  >
                    <option value="" disabled>
                      Automatico (basato sui gol)
                    </option>
                    <option value="teamA">Squadra A</option>
                    <option value="teamB">Squadra B</option>
                    <option value="draw">Pareggio</option>
                  </select>
                </div>
              </div>
            )}

            <div className="modal-action">
              <form method="dialog">
                <button className="btn btn-ghost mr-2">Annulla</button>
              </form>
              <button onClick={handleUpdateGame} className="btn btn-primary">
                Salva Modifiche
              </button>
            </div>
          </div>
        </dialog>
      </main>
    </div>
  );
}
