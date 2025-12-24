"use client";

import { useState, useEffect } from "react";
import Navbar from "../../../components/Navbar";
import { useParams, useRouter } from "next/navigation";
import { positions } from "../../../../models/enums";
import { balanceTeams } from "@/lib/balanceTeams";
import { PlayerToken } from "@/components/PlayerToken";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";

interface Player {
    _id?: string;
    id?: string;
    name: string;
    rating: number;
    position: string;
    image?: string;
}

export default function PlayMatch() {
    const { id } = useParams();
    const router = useRouter();
    const [participants, setParticipants] = useState<Player[]>([]);
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
    const [manualPlayerName, setManualPlayerName] = useState("");
    const [manualPlayerRating, setManualPlayerRating] = useState(50);
    const [manualPlayerPosition, setManualPlayerPosition] = useState("Centrocampista");
    const [teamA, setTeamA] = useState<Player[]>([]);
    const [teamB, setTeamB] = useState<Player[]>([]);
    const [isBalanced, setIsBalanced] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [gameNotification, setGameNotification] = useState<{ show: boolean; gameId: string | null }>({ show: false, gameId: null });
    const [gameStarted, setGameStarted] = useState(false);

    const { isDragging, handleDragStart, handleDragEnd, handleDropOnTeam, handleDragOver } = useDragAndDrop(
        teamA,
        teamB,
        setTeamA,
        setTeamB
    );

    useEffect(() => {
        if (id) {
            fetchParticipants();
        }
    }, [id]);

    const fetchParticipants = async () => {
        const res = await fetch(`/api/tournaments/${id}`);
        if (res.ok) {
            const data = await res.json();
            setParticipants(data.participants);
        }
    };

    const togglePlayer = (playerId: string) => {
        if (selectedPlayers.includes(playerId)) {
            setSelectedPlayers(selectedPlayers.filter((p) => p !== playerId));
        } else {
            setSelectedPlayers([...selectedPlayers, playerId]);
        }
    };

    const addManualPlayer = async () => {
        if (!manualPlayerName) return;

        try {
            // Call API to create persistent player in DB
            const res = await fetch(`/api/tournaments/${id}/players/manual`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: manualPlayerName,
                    position: manualPlayerPosition,
                    rating: manualPlayerRating,
                }),
            });

            if (res.ok) {
                const newPlayer = await res.json();

                // Add to local state
                setParticipants([...participants, newPlayer]);
                setSelectedPlayers([...selectedPlayers, newPlayer._id]);

                // Reset form
                setManualPlayerName("");
                setManualPlayerRating(50);
                setManualPlayerPosition("Centrocampista");
            } else {
                console.error("Failed to create manual player");
            }
        } catch (error) {
            console.error("Error adding manual player:", error);
        }
    };

    const handleBalanceTeams = () => {
        const playersToPlay = participants.filter((p) => selectedPlayers.includes(p._id!));
        const { teamA: tA, teamB: tB } = balanceTeams(playersToPlay);
        setTeamA(tA);
        setTeamB(tB);
        setIsBalanced(true);
    };

    const startMatch = async () => {
        if (isStarting) return; // Prevent multiple clicks
        setGameStarted(true);
        setIsStarting(true);
        try {
            const res = await fetch("/api/games", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tournamentId: id,
                    teamA: teamA.map(p => p._id),
                    teamB: teamB.map(p => p._id),
                    date: new Date(),
                }),
            });

            if (res.ok) {
                const game = await res.json();
                setGameNotification({ show: true, gameId: game._id });

                // Auto-dismiss notification after 10 seconds
                setTimeout(() => {
                    setGameNotification({ show: false, gameId: null });
                }, 10000);

                // Redirect to game page (to be implemented)
                // router.push(`/games/${game._id}`);
            }
        } catch (error) {
            console.error("Error starting match:", error);
        } finally {
            setIsStarting(false);
        }
    };

    return (
        <div className="min-h-screen bg-base-200">
            <Navbar />
            <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold mb-8">Prepara Partita</h1>

                {/* Game Started Notification */}
                {gameNotification.show && (
                    <div className="alert alert-success shadow-lg mb-6 animate-pulse">
                        <div className="flex items-center gap-4 w-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="flex-1">
                                <h3 className="font-bold">Partita Iniziata con Successo!</h3>
                                <div className="text-sm">ID Partita: {gameNotification.gameId}</div>
                            </div>
                            <button
                                onClick={() => setGameNotification({ show: false, gameId: null })}
                                className="btn btn-sm btn-ghost"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Selection Column */}
                    <div>
                        <div className="card bg-base-100 shadow-xl mb-6">
                            <div className="card-body">
                                <h2 className="card-title mb-4">Seleziona Giocatori</h2>
                                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                                    {participants.map((player) => (
                                        <div
                                            key={player._id}
                                            onClick={() => togglePlayer(player._id!)}
                                            className={`p-2 rounded cursor-pointer border transition ${selectedPlayers.includes(player._id!)
                                                ? "bg-primary text-primary-content border-primary"
                                                : "bg-base-200 border-base-300 hover:bg-base-300"
                                                }`}
                                        >
                                            <div className="font-medium">{player.name}</div>
                                            <div className="text-xs opacity-70">Valutazione: {player.rating}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h2 className="card-title mb-4">Aggiungi Giocatore Manuale</h2>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        placeholder="Nome"
                                        value={manualPlayerName}
                                        onChange={(e) => setManualPlayerName(e.target.value)}
                                        className="input input-bordered flex-1"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Valutazione"
                                        value={manualPlayerRating}
                                        onChange={(e) => setManualPlayerRating(parseInt(e.target.value))}
                                        className="input input-bordered w-24"
                                    />
                                </div>
                                <div className="mb-2">
                                    <select
                                        value={manualPlayerPosition}
                                        onChange={(e) => setManualPlayerPosition(e.target.value)}
                                        className="select select-bordered w-full"
                                    >
                                        <option value="Portiere">Portiere</option>
                                        <option value="Difensore">Difensore</option>
                                        <option value="Centrocampista">Centrocampista</option>
                                        <option value="Attaccante">Attaccante</option>
                                    </select>
                                </div>
                                <button
                                    onClick={addManualPlayer}
                                    className="btn btn-neutral w-full"
                                >
                                    Aggiungi e Seleziona
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Teams Column */}
                    <div>
                        <div className="flex justify-center mb-6">
                            <button
                                onClick={handleBalanceTeams}
                                disabled={selectedPlayers.length < 2}
                                className="btn btn-primary btn-lg w-full max-w-xs">
                                Bilancia Squadre
                            </button>
                        </div>

                        {isBalanced && (
                            <div className="w-full max-w-md md:max-w-xl lg:max-w-2xl mx-auto">
                                <div className="relative w-full  bg-cover bg-center rounded-xl overflow-hidden shadow-2xl border-4 border-white/20"
                                    style={{ backgroundImage: "url('/calcio_vert.jpeg')" }}>

                                    {/* Overlay for better text visibility */}
                                    <div className="absolute inset-0 bg-black/10"></div>

                                    {/* Team A - Top Half */}
                                    <div
                                        className={`w-full h-1/2 py-6 px-2 flex flex-col justify-start gap-1 md:gap-4 relative transition-all ${isDragging ? 'ring-4 ring-info ring-inset bg-info/5' : ''}`}
                                        onDragOver={handleDragOver}
                                        onDrop={() => handleDropOnTeam('A')}
                                    >
                                        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-info/80 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm z-10">
                                            Squadra A (Avg: {(teamA.reduce((a, b) => a + b.rating, 0) / teamA.length).toFixed(1)})
                                        </div>

                                        {/* Formation Rows for Team A (Top to Bottom: GK -> DEF -> MID -> ATT) */}
                                        <div className="flex justify-center"> {/* GK Zone */}
                                            {teamA.filter(p => p.position === 'Portiere').map(p => (
                                                <PlayerToken
                                                    key={p._id}
                                                    player={p}
                                                    color="info"
                                                    onDragStart={handleDragStart}
                                                    onDragEnd={handleDragEnd}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex justify-evenly"> {/* DEF Zone */}
                                            {teamA.filter(p => p.position === 'Difensore').map(p => (
                                                <PlayerToken
                                                    key={p._id}
                                                    player={p}
                                                    color="info"
                                                    onDragStart={handleDragStart}
                                                    onDragEnd={handleDragEnd}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex justify-evenly"> {/* MID Zone */}
                                            {teamA.filter(p => p.position === 'Centrocampista' || p.position === 'Jolly').map(p => (
                                                <PlayerToken
                                                    key={p._id}
                                                    player={p}
                                                    color="info"
                                                    onDragStart={handleDragStart}
                                                    onDragEnd={handleDragEnd}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex justify-evenly"> {/* ATT Zone */}
                                            {teamA.filter(p => p.position === 'Attaccante').map(p => (
                                                <PlayerToken
                                                    key={p._id}
                                                    player={p}
                                                    color="info"
                                                    onDragStart={handleDragStart}
                                                    onDragEnd={handleDragEnd}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* MidLine */}
                                    {isDragging && <div className="absolute top-1/2 left-0 w-full h-1 bg-white/50 z-20"></div>}
                                    <div className="w-full h-1/2 py-6 px-2 flex flex-col-reverse justify-start gap-4"></div>
                                    {/* Team B - Bottom Half */}
                                    <div
                                        className={`w-full h-1/2 py-6 px-2 flex flex-col-reverse justify-start gap-4 relative transition-all ${isDragging ? 'ring-4 ring-error ring-inset bg-error/5' : ''}`}
                                        onDragOver={handleDragOver}
                                        onDrop={() => handleDropOnTeam('B')}
                                    >
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-error/80 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm z-10">
                                            Squadra B (Avg: {(teamB.reduce((a, b) => a + b.rating, 0) / teamB.length).toFixed(1)})
                                        </div>

                                        {/* Formation Rows for Team B (Bottom to Top: GK -> DEF -> MID -> ATT) */}
                                        <div className="flex justify-center "> {/* GK Zone */}
                                            {teamB.filter(p => p.position === 'Portiere').map(p => (
                                                <PlayerToken
                                                    key={p._id}
                                                    player={p}
                                                    color="error"
                                                    onDragStart={handleDragStart}
                                                    onDragEnd={handleDragEnd}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex justify-evenly "> {/* DEF Zone */}
                                            {teamB.filter(p => p.position === 'Difensore').map(p => (
                                                <PlayerToken
                                                    key={p._id}
                                                    player={p}
                                                    color="error"
                                                    onDragStart={handleDragStart}
                                                    onDragEnd={handleDragEnd}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex justify-evenly "> {/* MID Zone */}
                                            {teamB.filter(p => p.position === 'Centrocampista' || p.position === 'Jolly').map(p => (
                                                <PlayerToken
                                                    key={p._id}
                                                    player={p}
                                                    color="error"
                                                    onDragStart={handleDragStart}
                                                    onDragEnd={handleDragEnd}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex justify-evenly px-12 pt-6"> {/* ATT Zone */}
                                            {teamB.filter(p => p.position === 'Attaccante').map(p => (
                                                <PlayerToken
                                                    key={p._id}
                                                    player={p}
                                                    color="error"
                                                    onDragStart={handleDragStart}
                                                    onDragEnd={handleDragEnd}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isBalanced && (
                            <div className="mt-8">
                                <button
                                    onClick={startMatch}
                                    disabled={gameStarted}
                                    className="btn btn-success btn-lg w-full text-white shadow-lg"
                                >
                                    {isStarting ? (
                                        <>
                                            <span className="loading loading-spinner"></span>
                                            Avvio in corso...
                                        </>
                                    ) : (
                                        "Inizia Partita"
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
