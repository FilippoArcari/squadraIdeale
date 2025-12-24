"use client";

import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
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
}

export default function TournamentDetails() {
    const { id } = useParams();
    const { data: session } = useSession();
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [showCreateGameModal, setShowCreateGameModal] = useState(false);
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
    const [gameDate, setGameDate] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [showReactivateModal, setShowReactivateModal] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [isReactivating, setIsReactivating] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        if (id) {
            fetchTournament();
        }
    }, [id]);

    const fetchTournament = async () => {
        const res = await fetch(`/api/tournaments/${id}`);
        if (res.ok) {
            const data = await res.json();
            setTournament(data);
        }
    };

    const togglePlayerSelection = (playerId: string) => {
        setSelectedPlayers(prev =>
            prev.includes(playerId)
                ? prev.filter(id => id !== playerId)
                : [...prev, playerId]
        );
    };

    const handleCreateGame = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedPlayers.length === 0) {
            setNotification({ type: "error", message: "Seleziona almeno un giocatore" });
            return;
        }

        if (!gameDate) {
            setNotification({ type: "error", message: "Seleziona una data per la partita" });
            return;
        }

        setIsCreating(true);
        try {
            const res = await fetch(`/api/tournaments/${id}/games`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    players: selectedPlayers,
                    date: gameDate,
                }),
            });

            if (res.ok) {
                setNotification({ type: "success", message: "Partita creata con successo!" });
                setShowCreateGameModal(false);
                setSelectedPlayers([]);
                setGameDate("");
                fetchTournament(); // Refresh tournament data
                setTimeout(() => setNotification(null), 3000);
            } else {
                const error = await res.json();
                setNotification({ type: "error", message: error.message || "Errore nella creazione della partita" });
            }
        } catch (error) {
            setNotification({ type: "error", message: "Errore di connessione" });
        } finally {
            setIsCreating(false);
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
                setNotification({ type: "error", message: "Impossibile copiare il codice" });
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
                setNotification({ type: "success", message: "Torneo disattivato con successo!" });
                setShowDeactivateModal(false);
                setTimeout(() => {
                    window.location.href = "/dashboard";
                }, 1500);
            } else {
                const error = await res.json();
                setNotification({ type: "error", message: error.message || "Errore nella disattivazione" });
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
                setNotification({ type: "success", message: "Hai lasciato il torneo con successo!" });
                setShowLeaveModal(false);
                setTimeout(() => {
                    window.location.href = "/dashboard";
                }, 1500);
            } else {
                const error = await res.json();
                setNotification({ type: "error", message: error.message || "Errore nell'uscita dal torneo" });
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
                setNotification({ type: "success", message: "Torneo riattivato con successo!" });
                setShowReactivateModal(false);
                fetchTournament(); // Refresh tournament data
                setTimeout(() => setNotification(null), 3000);
            } else {
                const error = await res.json();
                setNotification({ type: "error", message: error.message || "Errore nella riattivazione" });
            }
        } catch (error) {
            setNotification({ type: "error", message: "Errore di connessione" });
        } finally {
            setIsReactivating(false);
        }
    };

    if (!tournament) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Caricamento...</div>;

    // Calculate standings dynamically or use stored stats
    const sortedPlayers = [...tournament.participants].sort((a, b) => {
        // Sort by points, then goals, then MVPs
        if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
        if (b.stats.goals !== a.stats.goals) return b.stats.goals - a.stats.goals;
        return b.stats.mvps - a.stats.mvps;
    });

    return (
        <div className="min-h-screen bg-base-200">
            <Navbar />
            <div className="container mx-auto p-6">
                {/* Notifications */}
                {notification && (
                    <div className="toast toast-top toast-end z-50">
                        <div className={`alert ${notification.type === "success" ? "alert-success" : "alert-error"}`}>
                            <span>{notification.message}</span>
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">{tournament.name}</h1>
                        <p className="text-gray-500">Partecipanti: {tournament.participants.length}</p>
                    </div>

                    {/* Mobile Dropdown Menu */}
                    <div className="dropdown dropdown-end md:hidden">
                        <label tabIndex={0} className="btn btn-primary w-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                            </svg>
                            Menu Azioni
                        </label>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-64 mt-2">
                            {tournament.status === "completed" ? (
                                // Deactivated tournament - only reactivate option for owner
                                session && (session.user as any).id === tournament.owner && (
                                    <li>
                                        <a onClick={() => setShowReactivateModal(true)} className="text-success text-base">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                            </svg>
                                            Riattiva Torneo
                                        </a>
                                    </li>
                                )
                            ) : (
                                // Active tournament - normal actions
                                <>
                                    <li>
                                        <Link href={`/tournaments/${id}/play`} className="text-base">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                            </svg>
                                            Crea Nuova Partita
                                        </Link>
                                    </li>
                                    {session && (session.user as any).id === tournament.owner ? (
                                        <>
                                            <li>
                                                <Link href={`/tournaments/${id}/admin`} className="text-base">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                                    </svg>
                                                    Gestisci Torneo
                                                </Link>
                                            </li>
                                            <li>
                                                <a onClick={() => setShowDeactivateModal(true)} className="text-error text-base">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                                                    </svg>
                                                    Disattiva Torneo
                                                </a>
                                            </li>
                                        </>
                                    ) : (
                                        <li>
                                            <a onClick={() => setShowLeaveModal(true)} className="text-warning text-base">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                                                </svg>
                                                Esci dal Torneo
                                            </a>
                                        </li>
                                    )}
                                </>
                            )}
                        </ul>
                    </div>

                    {/* Desktop Buttons */}
                    <div className="hidden md:flex gap-3 flex-wrap">
                        {tournament.status === "completed" ? (
                            // Deactivated tournament - only reactivate button for owner
                            session && (session.user as any).id === tournament.owner && (
                                <button
                                    onClick={() => setShowReactivateModal(true)}
                                    className="btn btn-success"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                    </svg>
                                    Riattiva Torneo
                                </button>
                            )
                        ) : (
                            // Active tournament - normal actions
                            <>
                                <Link href={`/tournaments/${id}/play`}>
                                    <button className="btn btn-primary">
                                        Crea Nuova Partita
                                    </button>
                                </Link>
                                {session && (session.user as any).id === tournament.owner ? (
                                    <>
                                        <Link href={`/tournaments/${id}/admin`}>
                                            <button className="btn btn-secondary">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                                </svg>
                                                Gestisci Torneo
                                            </button>
                                        </Link>
                                        <button
                                            onClick={() => setShowDeactivateModal(true)}
                                            className="btn btn-error"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                                            </svg>
                                            Disattiva Torneo
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setShowLeaveModal(true)}
                                        className="btn btn-warning"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                                        </svg>
                                        Esci dal Torneo
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Join Code Card */}
                <div className="alert alert-info shadow-lg mb-6">
                    <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4 flex">
                            <div>
                                <h3 className="font-bold text-lg">Codice di Accesso</h3>
                                <p className="text-sm opacity-75">Condividi questo codice per invitare altri giocatori</p>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="text-3xl font-bold tracking-wider text-primary bg-base-100 px-6 py-3 rounded-lg">
                                    {tournament.joinCode}
                                </div>
                                <button
                                    className={`btn ${copied ? 'btn-success' : 'btn-primary'}`}
                                    onClick={copyJoinCode}
                                >
                                    {copied ? (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            Copiato!
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                            </svg>
                                            Copia
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Standings */}
                    <div className="lg:col-span-2 card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title mb-4">Classifica</h2>
                            <div className="overflow-x-auto">
                                <table className="table table-zebra w-full">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Giocatore</th>
                                            <th className="text-center">Punti</th>
                                            <th className="text-center">V</th>
                                            <th className="text-center">P</th>
                                            <th className="text-center">S</th>
                                            <th className="text-center">G</th>
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
                                                                    <div className="bg-neutral-focus text-neutral-content rounded-full w-10 h-10 flex items-center justify-center">
                                                                        <span className="text-sm font-bold">{player.name.substring(0, 2).toUpperCase()}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className="font-medium">{player.name}</span>
                                                    </div>
                                                </td>
                                                <td className="text-center font-bold text-success">{player.stats.points || 0}</td>
                                                <td className="text-center">{player.stats.wins || 0}</td>
                                                <td className="text-center">{player.stats.draws || 0}</td>
                                                <td className="text-center">{player.stats.losses || 0}</td>
                                                <td className="text-center">{player.stats.goals || 0}</td>
                                                <td className="text-center">{player.stats.mvps || 0}</td>
                                                <td className="text-center">{player.stats.gamesPlayed || 0}</td>
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
                                    <p className="text-gray-500 italic">Nessuna partita giocata ancora.</p>
                                ) : (
                                    tournament.games.map((game) => (
                                        <div key={game._id} className="alert alert-info shadow-sm">
                                            <div className="flex flex-col w-full">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="text-xs opacity-70 px-2">{new Date(game.date).toLocaleDateString()}</div>
                                                    {session?.user && !game.isFinalized && (
                                                        <Link href={`/games/${game._id}`}>
                                                            {(session.user as any).id === tournament.owner ? (
                                                                <button className="btn btn-xs btn-secondary">
                                                                    Gestisci
                                                                </button>
                                                            ) : (
                                                                <button className="btn btn-xs btn-primary">
                                                                    Vota
                                                                </button>
                                                            )}
                                                        </Link>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center w-full">
                                                    <span className="font-bold px-2">MVP</span>
                                                    <span className="px-2">{game.mvp?.name || "In attesa"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )
                                }
                            </div>
                        </div>
                    </div>
                </div>

                {/* Create Game Modal */}
                {showCreateGameModal && (
                    <div className="modal modal-open">
                        <div className="modal-box max-w-2xl">
                            <h3 className="font-bold text-lg mb-4">Crea Nuova Partita</h3>
                            <form onSubmit={handleCreateGame}>
                                {/* Date Picker */}
                                <div className="form-control mb-4">
                                    <label className="label">
                                        <span className="label-text">Data della Partita</span>
                                    </label>
                                    <input
                                        type="date"
                                        className="input input-bordered w-full"
                                        value={gameDate}
                                        onChange={(e) => setGameDate(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Player Selection */}
                                <div className="form-control mb-6">
                                    <label className="label">
                                        <span className="label-text">Seleziona Giocatori ({selectedPlayers.length} selezionati)</span>
                                    </label>
                                    <div className="border border-base-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                                        {tournament.participants.length === 0 ? (
                                            <p className="text-gray-500 italic">Nessun partecipante disponibile</p>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {tournament.participants.map((player) => (
                                                    <label
                                                        key={player._id}
                                                        className="cursor-pointer label justify-start gap-3"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox checkbox-primary"
                                                            checked={selectedPlayers.includes(player._id)}
                                                            onChange={() => togglePlayerSelection(player._id)}
                                                        />
                                                        <span className="label-text">{player.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="modal-action">
                                    <button
                                        type="button"
                                        className="btn"
                                        onClick={() => {
                                            setShowCreateGameModal(false);
                                            setSelectedPlayers([]);
                                            setGameDate("");
                                        }}
                                        disabled={isCreating}
                                    >
                                        Annulla
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isCreating || selectedPlayers.length === 0}
                                    >
                                        {isCreating ? "Creazione..." : "Crea Partita"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Deactivate Tournament Modal */}
                {showDeactivateModal && (
                    <div className="modal modal-open">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg mb-4">Disattiva Torneo</h3>
                            <p className="mb-6">Sei sicuro di voler disattivare questo torneo? Questa azione segnerà il torneo come completato e non sarà più possibile creare nuove partite.</p>
                            <div className="modal-action">
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setShowDeactivateModal(false)}
                                    disabled={isDeactivating}
                                >
                                    Annulla
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-error"
                                    onClick={handleDeactivateTournament}
                                    disabled={isDeactivating}
                                >
                                    {isDeactivating ? "Disattivazione..." : "Disattiva"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Leave Tournament Modal */}
                {showLeaveModal && (
                    <div className="modal modal-open">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg mb-4">Esci dal Torneo</h3>
                            <p className="mb-6">Sei sicuro di voler uscire da questo torneo? Le tue statistiche saranno mantenute ma non potrai più partecipare alle nuove partite.</p>
                            <div className="modal-action">
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setShowLeaveModal(false)}
                                    disabled={isLeaving}
                                >
                                    Annulla
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-warning"
                                    onClick={handleLeaveTournament}
                                    disabled={isLeaving}
                                >
                                    {isLeaving ? "Uscita..." : "Esci"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
