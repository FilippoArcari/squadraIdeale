"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "../../../components/Navbar";

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
}

interface Tournament {
    _id: string;
    name: string;
    owner: string;
    admins: Player[];
    participants: Player[];
    games: Game[];
}

export default function AdminDashboard() {
    const { id } = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [activeTab, setActiveTab] = useState<"players" | "games" | "points">("players");
    const [isLoading, setIsLoading] = useState(true);

    // Edit States
    const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
    const [newRating, setNewRating] = useState<number>(50);

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

    // Player Actions
    const handleUpdateRating = async (playerId: string) => {
        const res = await fetch(`/api/tournaments/${id}/players/${playerId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rating: newRating }),
        });
        if (res.ok) {
            setEditingPlayer(null);
            fetchTournament();
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
        game.goals.forEach(g => goalsMap[g.player] = g.count);

        setGameForm({
            date: game.date.split('T')[0],
            goals: goalsMap,
            mvp: game.mvp?._id || "",
            manualWinner: game.manualWinner || ""
        });

        // Open modal
        (document.getElementById('game_modal') as HTMLDialogElement).showModal();
    };

    const handleUpdateGame = async () => {
        if (!editingGame) return;

        // Transform goals map back to array
        const goalsArray = Object.entries(gameForm.goals).map(([player, count]) => ({
            player,
            count
        }));

        const res = await fetch(`/api/games/${editingGame._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                date: gameForm.date,
                goals: goalsArray,
                mvp: gameForm.mvp || null,
                manualWinner: gameForm.manualWinner || null
            }),
        });

        if (res.ok) {
            (document.getElementById('game_modal') as HTMLDialogElement).close();
            setEditingGame(null);
            fetchTournament();
        }
    };

    const handleUpdatePoints = async (playerId: string) => {
        const res = await fetch(`/api/tournaments/${id}/players/${playerId}/points`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ points: newPoints }),
        });
        if (res.ok) {
            setEditingPoints(null);
            fetchTournament();
        }
    };

    const handlePromoteAdmin = async (playerId: string) => {
        if (!confirm("Sei sicuro di voler promuovere questo giocatore ad admin?")) return;

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
        if (!confirm("Sei sicuro di voler rimuovere i privilegi admin da questo giocatore?")) return;

        const res = await fetch(`/api/tournaments/${id}/admins`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId }),
        });
        if (res.ok) {
            fetchTournament();
        }
    };

    if (isLoading || !tournament) return <div className="min-h-screen bg-base-200 flex items-center justify-center"><span className="loading loading-spinner loading-lg"></span></div>;

    return (
        <div className="min-h-screen bg-base-200">
            <Navbar />
            <div className="container mx-auto p-6">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">{tournament.name}</h1>
                        <p className="text-sm opacity-70">Admin Dashboard</p>
                    </div>
                    <button onClick={() => router.push(`/tournaments/${id}`)} className="btn btn-ghost">
                        Torna al Torneo
                    </button>
                </div>

                <div className="tabs tabs-boxed mb-6">
                    <a
                        className={`tab ${activeTab === 'players' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('players')}
                    >
                        Giocatori
                    </a>
                    <a
                        className={`tab ${activeTab === 'games' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('games')}
                    >
                        Partite
                    </a>
                    <a
                        className={`tab ${activeTab === 'points' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('points')}
                    >
                        Gestione Punti
                    </a>
                </div>

                {activeTab === 'players' && (
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
                                        {tournament.participants.map(player => (
                                            <tr key={player._id}>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="avatar">
                                                            <div className="w-10 h-10 rounded-full">
                                                                {player.image ? (
                                                                    <img src={player.image} alt={player.name} />
                                                                ) : (
                                                                    <div className="bg-neutral-focus text-neutral-content rounded-full w-10 h-10 flex items-center justify-center">
                                                                        <span className="text-sm">{player.name.substring(0, 2).toUpperCase()}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className="font-bold">{player.name}</span>
                                                    </div>
                                                </td>
                                                <td>{player.position}</td>
                                                <td>
                                                    {editingPlayer === player._id ? (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                value={newRating}
                                                                onChange={(e) => setNewRating(parseInt(e.target.value || "0"))}
                                                                className="input input-xs input-primary w-24"
                                                            />
                                                            <span className="text-xs font-bold w-6">{newRating}</span>
                                                            <button onClick={() => handleUpdateRating(player._id)} className="btn btn-xs btn-success btn-square">✓</button>
                                                            <button onClick={() => setEditingPlayer(null)} className="btn btn-xs btn-ghost btn-square">✕</button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="badge badge-outline">{player.rating}</span>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingPlayer(player._id);
                                                                    setNewRating(player.rating);
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
                                                        disabled={(session?.user as any).id === tournament.owner && player.name === session?.user?.name} // Prevent owner removing themselves roughly
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

                {activeTab === 'points' && (
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
                                        {tournament.participants.map(player => (
                                            <tr key={player._id}>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="avatar">
                                                            <div className="w-10 h-10 rounded-full">
                                                                {player.image ? (
                                                                    <img src={player.image} alt={player.name} />
                                                                ) : (
                                                                    <div className="bg-neutral-focus text-neutral-content rounded-full w-10 h-10 flex items-center justify-center">
                                                                        <span className="text-sm">{player.name.substring(0, 2).toUpperCase()}</span>
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
                                                                onChange={(e) => setNewPoints(parseInt(e.target.value || "0"))}
                                                                className="input input-xs input-primary w-24"
                                                            />
                                                            <button onClick={() => handleUpdatePoints(player._id)} className="btn btn-xs btn-success btn-square">✓</button>
                                                            <button onClick={() => setEditingPoints(null)} className="btn btn-xs btn-ghost btn-square">✕</button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="badge badge-lg badge-success">{(player as any).stats?.points || 0}</span>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingPoints(player._id);
                                                                    setNewPoints((player as any).stats?.points || 0);
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
                                                        V: {(player as any).stats?.wins || 0} |
                                                        P: {(player as any).stats?.draws || 0} |
                                                        S: {(player as any).stats?.losses || 0}
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

                {activeTab === 'games' && (
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title mb-4">Gestione Partite</h2>
                            <div className="space-y-4">
                                {tournament.games.map(game => (
                                    <div key={game._id} className="alert bg-base-200 shadow-sm flex justify-between items-center">
                                        <div>
                                            <div className="font-bold text-sm opacity-70">{new Date(game.date).toLocaleDateString()}</div>
                                            <div className="text-lg">
                                                {game.teamA.length} vs {game.teamB.length} Giocatori
                                            </div>
                                            <div className="text-xs mt-1">
                                                MVP: {game.mvp?.name || "N/A"} | Vincitore: {game.manualWinner || "Auto"}
                                            </div>
                                        </div>
                                        <button onClick={() => openGameModal(game)} className="btn btn-sm btn-primary">
                                            Modifica
                                        </button>
                                    </div>
                                ))}
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
                                        onChange={(e) => setGameForm({ ...gameForm, date: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-bold mb-2 text-info">Squadra A</h4>
                                        {editingGame.teamA.map(p => (
                                            <div key={p._id} className="flex justify-between items-center mb-2">
                                                <span className="text-sm">{p.name}</span>
                                                <input
                                                    type="number"
                                                    className="input input-bordered input-xs w-16"
                                                    value={gameForm.goals[p._id] || 0}
                                                    onChange={(e) => setGameForm({
                                                        ...gameForm,
                                                        goals: { ...gameForm.goals, [p._id]: parseInt(e.target.value) || 0 }
                                                    })}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <h4 className="font-bold mb-2 text-error">Squadra B</h4>
                                        {editingGame.teamB.map(p => (
                                            <div key={p._id} className="flex justify-between items-center mb-2">
                                                <span className="text-sm">{p.name}</span>
                                                <input
                                                    type="number"
                                                    className="input input-bordered input-xs w-16"
                                                    value={gameForm.goals[p._id] || 0}
                                                    onChange={(e) => setGameForm({
                                                        ...gameForm,
                                                        goals: { ...gameForm.goals, [p._id]: parseInt(e.target.value) || 0 }
                                                    })}
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
                                        onChange={(e) => setGameForm({ ...gameForm, mvp: e.target.value })}
                                    >
                                        <option value="" disabled >Seleziona MVP</option>
                                        {[...editingGame.teamA, ...editingGame.teamB].map(p => (
                                            <option key={p._id} value={p._id}>{p.name}</option>
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
                                        onChange={(e) => setGameForm({ ...gameForm, manualWinner: e.target.value as any })}
                                    >
                                        <option value="" disabled>Automatico (basato sui gol)</option>
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
                            <button onClick={handleUpdateGame} className="btn btn-primary">Salva Modifiche</button>
                        </div>
                    </div>
                </dialog>
            </div>
        </div>
    );
}
