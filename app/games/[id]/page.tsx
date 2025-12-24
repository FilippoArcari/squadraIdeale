"use client";

import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Player {
    _id: string;
    name: string;
    image?: string;
}

interface Game {
    _id: string;
    teamA: Player[];
    teamB: Player[];
    isVotingOpen: boolean;
    isFinalized?: boolean;
    votes: { voter: string; votedFor: string }[];
    goals: { player: string; count: number }[];
    turnament: { _id: string; owner: string };
    manualWinner?: "teamA" | "teamB" | "draw";
    mvp?: Player | string;
}

export default function GamePage() {
    const { id } = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [game, setGame] = useState<Game | null>(null);
    const [goals, setGoals] = useState<{ [key: string]: number }>({});
    const [hasVoted, setHasVoted] = useState(false);

    useEffect(() => {
        if (id) {
            fetchGame();
            // Only poll if we are NOT the owner OR if voting is open OR if game is finalized
            // If we are the owner and the game is in progress, we are the source of truth, so no need to poll
            // This prevents re-renders interfering with goal entry
            const shouldPoll = !session?.user || (session.user as any).id !== game?.turnament?.owner || game?.isVotingOpen || game?.isFinalized;

            if (shouldPoll) {
                const interval = setInterval(fetchGame, 2000);
                return () => clearInterval(interval);
            }
        }
    }, [id, game?.isVotingOpen, game?.isFinalized, game?.turnament?.owner]); // Re-run if status changes

    // Redirect owner when game is finalized
    useEffect(() => {
        const isOwner = (session?.user as any)?.id === game?.turnament?.owner;
        if (game?.isFinalized && isOwner) {
            router.push("/dashboard");
        }
    }, [game?.isFinalized, session, game?.turnament?.owner, router]);

    const fetchGame = async () => {
        const res = await fetch(`/api/games/${id}`, { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();

            // Only update state if data has changed
            if (JSON.stringify(data) !== JSON.stringify(game)) {
                setGame(data);

                // Initialize goals only if empty
                if (Object.keys(goals).length === 0) {
                    const initialGoals: { [key: string]: number } = {};
                    data.goals.forEach((g: { player: string; count: number }) => {
                        initialGoals[g.player] = g.count;
                    });
                    setGoals(initialGoals);
                }
            }
        }
    };

    const handleGoalChange = (playerId: string, value: string) => {
        const intVal = parseInt(value);
        setGoals({ ...goals, [playerId]: isNaN(intVal) ? 0 : intVal });
    };

    const endMatch = async () => {
        const res = await fetch(`/api/games/${id}/end`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ goals }),
        });
        if (res.ok) {
            fetchGame();
        }
    };

    const castVote = async (playerId: string) => {
        const res = await fetch(`/api/games/${id}/vote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ votedFor: playerId }),
        });

        if (res.ok) {
            const data = await res.json();
            setHasVoted(true);
            if (data.votingComplete) {
                finalizeMatch();
            } else {
                fetchGame();
            }
        }
    };

    const finalizeMatch = async () => {
        const res = await fetch(`/api/games/${id}/finalize`, {
            method: "POST"
        });
        if (res.ok) {
            if (isOwner) {
                router.push("/dashboard");
            } else {
                // Non-owner: refresh to show finalized state
                fetchGame();
            }
        }
    };

    if (!game) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Caricamento...</div>;

    const allPlayers = [...game.teamA, ...game.teamB];
    const isOwner = (session?.user as any)?.id === game.turnament?.owner;

    // Get MVP name
    const mvpPlayer = typeof game.mvp === 'string'
        ? allPlayers.find(p => p._id === game.mvp)
        : game.mvp;

    return (
        <div className="min-h-screen bg-base-200">
            <Navbar />
            <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold mb-8 text-center">Partita in Corso</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="card bg-info/10 border border-info shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title justify-center text-2xl font-bold text-info mb-4">Squadra A</h2>
                            {game.teamA.map(p => (
                                <div key={p._id} className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="avatar">
                                            <div className="w-8 h-8 rounded-full">
                                                {p.image ? (
                                                    <img src={p.image} alt={p.name} />
                                                ) : (
                                                    <div className="bg-neutral-focus text-neutral-content rounded-full w-8 h-8 flex items-center justify-center">
                                                        <span className="text-xs">{p.name.substring(0, 2).toUpperCase()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <span className="font-medium">{p.name}</span>
                                    </div>
                                    {!game.isVotingOpen && isOwner ? (
                                        <input
                                            type="number"
                                            min="0"
                                            className="input input-bordered input-sm w-20 text-center"
                                            placeholder="Gol"
                                            value={goals[p._id] === 0 ? "0" : goals[p._id] || ""}
                                            onChange={(e) => handleGoalChange(p._id, e.target.value)}
                                        />
                                    ) : (
                                        <span className="text-xl font-bold">{goals[p._id] || 0}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card bg-error/10 border border-error shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title justify-center text-2xl font-bold text-error mb-4">Squadra B</h2>
                            {game.teamB.map(p => (
                                <div key={p._id} className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="avatar">
                                            <div className="w-8 h-8 rounded-full">
                                                {p.image ? (
                                                    <img src={p.image} alt={p.name} />
                                                ) : (
                                                    <div className="bg-neutral-focus text-neutral-content rounded-full w-8 h-8 flex items-center justify-center">
                                                        <span className="text-xs">{p.name.substring(0, 2).toUpperCase()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <span className="font-medium">{p.name}</span>
                                    </div>
                                    {!game.isVotingOpen && isOwner ? (
                                        <input
                                            type="number"
                                            min="0"
                                            className="input input-bordered input-sm w-20 text-center"
                                            placeholder="Gol"
                                            value={goals[p._id] === 0 ? "0" : goals[p._id] || ""}
                                            onChange={(e) => handleGoalChange(p._id, e.target.value)}
                                        />
                                    ) : (
                                        <span className="text-xl font-bold">{goals[p._id] || 0}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Game Finalized Display */}
                {game.isFinalized ? (
                    <div className="card bg-base-100 shadow-xl max-w-2xl mx-auto">
                        <div className="card-body">
                            <div className="text-center">
                                <div className="mb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-3xl font-bold mb-6">Partita Conclusa!</h2>

                                {/* Final Score */}
                                <div className="bg-base-200 rounded-xl p-6 mb-6">
                                    <h3 className="text-xl font-bold mb-4">Risultato Finale</h3>
                                    <div className="text-4xl font-black mb-4">
                                        <span className="text-info">{game.teamA.reduce((acc, p) => acc + (goals[p._id] || 0), 0)}</span>
                                        {" - "}
                                        <span className="text-error">{game.teamB.reduce((acc, p) => acc + (goals[p._id] || 0), 0)}</span>
                                    </div>
                                    <div className="badge badge-lg badge-primary">
                                        {game.manualWinner === 'teamA' ? 'Vince Squadra A' :
                                            game.manualWinner === 'teamB' ? 'Vince Squadra B' : 'Pareggio'}
                                    </div>
                                </div>

                                {/* MVP Display */}
                                {mvpPlayer && (
                                    <div className="bg-warning/20 border border-warning rounded-xl p-6 mb-6">
                                        <h3 className="text-xl font-bold mb-4">🏆 MVP della Partita</h3>
                                        <div className="flex items-center justify-center gap-4">
                                            <div className="avatar">
                                                <div className="w-16 h-16 rounded-full ring ring-warning ring-offset-base-100 ring-offset-2">
                                                    {mvpPlayer.image ? (
                                                        <img src={mvpPlayer.image} alt={mvpPlayer.name} />
                                                    ) : (
                                                        <div className="bg-warning text-warning-content rounded-full w-16 h-16 flex items-center justify-center">
                                                            <span className="text-2xl font-bold">{mvpPlayer.name.substring(0, 2).toUpperCase()}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-2xl font-bold">{mvpPlayer.name}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Return Button */}
                                <button
                                    onClick={() => router.push(`/tournaments/${game.turnament._id}`)}
                                    className="btn btn-primary btn-lg w-full"
                                >
                                    Torna al Torneo
                                </button>
                            </div>
                        </div>
                    </div>
                ) : !game.isVotingOpen ? (
                    isOwner ? (
                        <div className="flex flex-col items-center gap-6">
                            {/* Score Display */}
                            <div className="card bg-base-100 shadow-lg w-full max-w-2xl">
                                <div className="card-body">
                                    <h3 className="font-bold text-lg mb-4 text-center">Punteggio Attuale</h3>
                                    <div className="text-center">
                                        <div className="text-5xl font-black mb-4">
                                            <span className="text-info">{game.teamA.reduce((acc, p) => acc + (goals[p._id] || 0), 0)}</span>
                                            {" - "}
                                            <span className="text-error">{game.teamB.reduce((acc, p) => acc + (goals[p._id] || 0), 0)}</span>
                                        </div>
                                        <div className="text-sm opacity-70">
                                            Il vincitore sarà determinato automaticamente in base al punteggio
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={endMatch}
                                className="btn btn-error btn-lg shadow-lg"
                            >
                                Termina Partita e Inizia Votazione
                            </button>
                        </div>
                    ) : (
                        <div className="alert alert-info shadow-lg max-w-2xl mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current flex-shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <div>
                                <h3 className="font-bold">Partita in corso</h3>
                                <div className="text-xs">L'organizzatore sta inserendo i gol. La votazione MVP inizierà a breve.</div>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="card bg-base-100 shadow-xl max-w-2xl mx-auto">
                        <div className="card-body">
                            {/* Match Result Display */}
                            <div className="text-center mb-6 p-4 bg-base-200 rounded-xl">
                                <h2 className="text-xl font-bold mb-2">Risultato Finale</h2>
                                <div className="text-3xl font-black mb-2">
                                    {game.teamA.reduce((acc, p) => acc + (goals[p._id] || 0), 0)} - {game.teamB.reduce((acc, p) => acc + (goals[p._id] || 0), 0)}
                                </div>
                                <div className="badge badge-lg badge-primary">
                                    {game.manualWinner === 'teamA' ? 'Vince Squadra A' :
                                        game.manualWinner === 'teamB' ? 'Vince Squadra B' : 'Pareggio'}
                                </div>
                            </div>

                            <h2 className="card-title justify-center text-2xl font-bold mb-6">Vota per l'MVP</h2>
                            <div className="flex justify-center mb-6">
                                <div className="radial-progress text-primary" style={{ "--value": (game.votes.length / allPlayers.length) * 100 } as any} role="progressbar">
                                    {game.votes.length} / {allPlayers.length}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {allPlayers.map(p => (
                                    <button
                                        key={p._id}
                                        onClick={() => castVote(p._id)}
                                        disabled={hasVoted}
                                        className={`btn h-auto py-4 flex flex-col gap-2 ${hasVoted
                                            ? "btn-disabled"
                                            : "btn-primary"
                                            }`}
                                    >
                                        <div className="avatar">
                                            <div className="w-12 h-12 rounded-full">
                                                {p.image ? (
                                                    <img src={p.image} alt={p.name} />
                                                ) : (
                                                    <div className="bg-neutral text-neutral-content rounded-full w-12 h-12 flex items-center justify-center">
                                                        <span className="text-sm font-bold">{p.name.substring(0, 2).toUpperCase()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-sm">{p.name}</span>
                                    </button>
                                ))}
                            </div>

                            {isOwner && (
                                <div className="mt-8 text-center">
                                    <button
                                        className="btn btn-link text-error"
                                        onClick={finalizeMatch}
                                    >
                                        Termina Votazione e Finalizza
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
