"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Navbar from "../components/Navbar";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Tournament {
    _id: string;
    name: string;
    sport: string;
    season: number;
    status: string;
}

export default function Dashboard() {
    const { data: session, status } = useSession();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joinCode, setJoinCode] = useState("");
    const [playerName, setPlayerName] = useState("");
    const [position, setPosition] = useState("Centrocampista");
    const [rating, setRating] = useState(50);
    const [isJoining, setIsJoining] = useState(false);
    const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [newTournament, setNewTournament] = useState({
        name: "",
        sport: "Calcio",
        season: new Date().getFullYear(),
        description: "",
    });
    const router = useRouter();

    useEffect(() => {
        fetchTournaments();
    }, []);

    const fetchTournaments = async () => {
        const res = await fetch("/api/tournaments");
        if (res.ok) {
            const data = await res.json();
            setTournaments(data);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch("/api/tournaments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newTournament),
        });

        if (res.ok) {
            setShowModal(false);
            fetchTournaments();
            setNewTournament({ name: "", sport: "Calcio", season: new Date().getFullYear(), description: "" });
        }
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!playerName.trim()) {
            setNotification({ type: "error", message: "Inserisci il nome del giocatore" });
            return;
        }

        setIsJoining(true);
        try {
            const res = await fetch("/api/tournaments/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    joinCode: joinCode.toUpperCase(),
                    playerName: playerName,
                    position: position,
                    rating: rating,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setNotification({ type: "success", message: "Sei entrato nel torneo!" });
                setShowJoinModal(false);
                setJoinCode("");
                setPlayerName("");
                setPosition("Centrocampista");
                setRating(50);

                // Redirect to tournament page
                setTimeout(() => {
                    router.push(`/tournaments/${data.tournament._id}`);
                }, 1500);
            } else {
                setNotification({ type: "error", message: data.message || "Errore nell'unirsi al torneo" });
            }
        } catch (error) {
            setNotification({ type: "error", message: "Errore di connessione" });
        } finally {
            setIsJoining(false);
        }
    };

    // Authentication check
    if (status === "loading") {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (status === "unauthenticated") {
        router.push("/login");
        return null;
    }

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
                    <h1 className="text-3xl font-bold">I Tuoi Tornei</h1>

                    {/* Mobile Dropdown Menu */}
                    <div className="dropdown dropdown-end md:hidden">
                        <label tabIndex={0} className="btn btn-primary w-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                            </svg>
                            Menu Azioni
                        </label>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-64 mt-2">
                            <li>
                                <a onClick={() => setShowJoinModal(true)} className="text-base">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Entra in un Torneo
                                </a>
                            </li>
                            <li>
                                <a onClick={() => setShowModal(true)} className="text-base">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Nuovo Torneo
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Desktop Buttons */}
                    <div className="hidden md:flex gap-3">
                        <button
                            onClick={() => setShowJoinModal(true)}
                            className="btn btn-secondary"
                        >
                            Entra in un Torneo
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="btn btn-primary"
                        >
                            + Nuovo Torneo
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tournaments.map((t) => (
                        <Link key={t._id} href={`/tournaments/${t._id}`}>
                            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition cursor-pointer">
                                <div className="card-body">
                                    <h2 className="card-title">
                                        {t.name}
                                        <div className={`badge ${t.status === 'active' ? 'badge-success' : 'badge-ghost'}`}>
                                            {t.status === 'active' ? 'ATTIVO' : 'COMPLETATO'}
                                        </div>
                                    </h2>
                                    <p>{t.sport} - Stagione {t.season}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Join Tournament Modal */}
                {showJoinModal && (
                    <div className="modal modal-open">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg mb-4">Entra in un Torneo</h3>
                            <form onSubmit={handleJoin} className="space-y-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Codice di Accesso</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                        className="input input-bordered w-full text-center text-2xl font-bold tracking-widest"
                                        placeholder="ABC123"
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Nome Giocatore</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={playerName}
                                        onChange={(e) => setPlayerName(e.target.value)}
                                        className="input input-bordered w-full"
                                        placeholder="Il tuo nome"
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Posizione</span>
                                    </label>
                                    <select
                                        value={position}
                                        onChange={(e) => setPosition(e.target.value)}
                                        className="select select-bordered w-full"
                                        required
                                    >
                                        <option value="Portiere">Portiere</option>
                                        <option value="Difensore">Difensore</option>
                                        <option value="Centrocampista">Centrocampista</option>
                                        <option value="Attaccante">Attaccante</option>
                                    </select>
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Rating ({rating})</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={rating}
                                        onChange={(e) => setRating(parseInt(e.target.value))}
                                        className="range range-primary"
                                    />
                                    <div className="w-full flex justify-between text-xs px-2 mt-1">
                                        <span>0</span>
                                        <span>50</span>
                                        <span>100</span>
                                    </div>
                                </div>
                                <div className="modal-action">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowJoinModal(false);
                                            setJoinCode("");
                                            setPlayerName("");
                                            setPosition("Centrocampista");
                                            setRating(50);
                                        }}
                                        className="btn btn-ghost"
                                        disabled={isJoining}
                                    >
                                        Annulla
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isJoining || !joinCode || !playerName.trim()}
                                    >
                                        {isJoining ? "Entrando..." : "Entra"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Create Tournament Modal */}
                {showModal && (
                    <div className="modal modal-open">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg mb-4">Crea Torneo</h3>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Nome</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newTournament.name}
                                        onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                                        className="input input-bordered w-full"
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Sport</span>
                                    </label>
                                    <select
                                        value={newTournament.sport}
                                        onChange={(e) => setNewTournament({ ...newTournament, sport: e.target.value })}
                                        className="select select-bordered w-full"
                                    >
                                        <option value="Calcio">Calcio</option>
                                        <option value="Basket">Basket</option>
                                        <option value="Volley">Volley</option>
                                    </select>
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Stagione</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        value={newTournament.season}
                                        onChange={(e) => setNewTournament({ ...newTournament, season: parseInt(e.target.value) })}
                                        className="input input-bordered w-full"
                                    />
                                </div>
                                <div className="modal-action">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="btn btn-ghost"
                                    >
                                        Annulla
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                    >
                                        Crea
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
