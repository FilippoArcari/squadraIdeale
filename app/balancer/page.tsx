"use client";

import { useState } from "react";
import Link from "next/link";
import { positions } from "../../models/enums";
import { balanceTeams } from "@/lib/balanceTeams";
import { PlayerToken } from "@/components/PlayerToken";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";

interface Player {
    id?: string;
    _id?: string;
    name: string;
    rating: number;
    position: string;
}

export default function TeamBalancer() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [manualPlayerName, setManualPlayerName] = useState("");
    const [manualPlayerRating, setManualPlayerRating] = useState(50);
    const [manualPlayerPosition, setManualPlayerPosition] = useState("Centrocampista");
    const [teamA, setTeamA] = useState<Player[]>([]);
    const [teamB, setTeamB] = useState<Player[]>([]);
    const [isBalanced, setIsBalanced] = useState(false);

    const { isDragging, handleDragStart, handleDragEnd, handleDropOnTeam, handleDragOver } = useDragAndDrop(
        teamA,
        teamB,
        setTeamA,
        setTeamB
    );

    const addPlayer = () => {
        if (!manualPlayerName.trim()) return;

        const newPlayer: Player = {
            id: `player_${Date.now()}`,
            name: manualPlayerName.trim(),
            position: manualPlayerPosition,
            rating: manualPlayerRating,
        };

        setPlayers([...players, newPlayer]);
        setManualPlayerName("");
        setManualPlayerRating(50);
        setManualPlayerPosition("Centrocampista");
        setIsBalanced(false);
    };

    const removePlayer = (playerId: string) => {
        setPlayers(players.filter((p) => p.id !== playerId));
        setIsBalanced(false);
    };

    const clearAll = () => {
        setPlayers([]);
        setTeamA([]);
        setTeamB([]);
        setIsBalanced(false);
    };

    const handleBalanceTeams = () => {
        const { teamA: tA, teamB: tB } = balanceTeams(players);
        setTeamA(tA);
        setTeamB(tB);
        setIsBalanced(true);
    };

    return (
        <div className="min-h-screen bg-base-200">
            {/* Header */}
            <div className="navbar bg-base-100 shadow-lg">
                <div className="flex-1">
                    <Link href="/" className="btn btn-ghost text-xl">
                        ⚽ Squadra Ideale
                    </Link>
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

            <div className="container mx-auto p-6">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2">Bilancia Squadre</h1>
                    <p className="text-lg opacity-70">
                        Aggiungi giocatori e crea squadre equilibrate in pochi secondi
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Player Management */}
                    <div className="space-y-6">
                        {/* Add Player Card */}
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h2 className="card-title mb-4">Aggiungi Giocatore</h2>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        placeholder="Nome"
                                        value={manualPlayerName}
                                        onChange={(e) => setManualPlayerName(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                                        className="input input-bordered flex-1"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Valutazione"
                                        value={manualPlayerRating}
                                        onChange={(e) => setManualPlayerRating(parseInt(e.target.value) || 0)}
                                        className="input input-bordered w-24"
                                        min="0"
                                        max="100"
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
                                    onClick={addPlayer}
                                    className="btn btn-primary w-full"
                                    disabled={!manualPlayerName.trim()}
                                >
                                    Aggiungi Giocatore
                                </button>
                            </div>
                        </div>

                        {/* Players List */}
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="card-title">
                                        Giocatori ({players.length})
                                    </h2>
                                    {players.length > 0 && (
                                        <button
                                            onClick={clearAll}
                                            className="btn btn-sm btn-ghost btn-error"
                                        >
                                            Cancella Tutti
                                        </button>
                                    )}
                                </div>
                                {players.length === 0 ? (
                                    <div className="text-center py-8 opacity-50">
                                        <p>Nessun giocatore aggiunto</p>
                                        <p className="text-sm mt-2">Aggiungi almeno 2 giocatori per bilanciare le squadre</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {players.map((player) => (
                                            <div
                                                key={player.id}
                                                className="flex justify-between items-center p-3 bg-base-200 rounded-lg"
                                            >
                                                <div>
                                                    <div className="font-medium">{player.name}</div>
                                                    <div className="text-xs opacity-70">
                                                        {player.position} • Rating: {player.rating}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removePlayer(player.id!)}
                                                    className="btn btn-sm btn-ghost btn-circle"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Teams Display */}
                    <div>
                        <div className="flex justify-center mb-6">
                            <button
                                onClick={handleBalanceTeams}
                                disabled={players.length < 2}
                                className="btn btn-primary btn-lg w-full max-w-xs">
                                {isBalanced ? "Rigenera Squadre" : "Bilancia Squadre"}
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
                                            Squadra A (Avg: {teamA.length > 0 ? (teamA.reduce((a, b) => a + b.rating, 0) / teamA.length).toFixed(1) : '0'})
                                        </div>

                                        {/* Formation Rows for Team A (Top to Bottom: GK -> DEF -> MID -> ATT) */}
                                        <div className="flex justify-center"> {/* GK Zone */}
                                            {teamA.filter(p => p.position === 'Portiere').map(p => (
                                                <PlayerToken
                                                    key={p.id}
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
                                                    key={p.id}
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
                                                    key={p.id}
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
                                                    key={p.id}
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
                                            Squadra B (Avg: {teamB.length > 0 ? (teamB.reduce((a, b) => a + b.rating, 0) / teamB.length).toFixed(1) : '0'})
                                        </div>

                                        {/* Formation Rows for Team B (Bottom to Top: GK -> DEF -> MID -> ATT) */}
                                        <div className="flex justify-center "> {/* GK Zone */}
                                            {teamB.filter(p => p.position === 'Portiere').map(p => (
                                                <PlayerToken
                                                    key={p.id}
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
                                                    key={p.id}
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
                                                    key={p.id}
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
                                                    key={p.id}
                                                    player={p}
                                                    color="error"
                                                    onDragStart={handleDragStart}
                                                    onDragEnd={handleDragEnd}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Team Stats */}
                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    <div className="stat bg-info/10 rounded-lg p-4">
                                        <div className="stat-title text-info">Squadra A</div>
                                        <div className="stat-value text-info text-2xl">{teamA.length}</div>
                                        <div className="stat-desc">giocatori</div>
                                    </div>
                                    <div className="stat bg-error/10 rounded-lg p-4">
                                        <div className="stat-title text-error">Squadra B</div>
                                        <div className="stat-value text-error text-2xl">{teamB.length}</div>
                                        <div className="stat-desc">giocatori</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isBalanced && players.length >= 2 && (
                            <div className="text-center py-12 opacity-50">
                                <p className="text-lg">Clicca su "Bilancia Squadre" per iniziare</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
