"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Icon from "@/components/Icon";
import { useParams, useRouter } from "next/navigation";
import { positions } from "@/models/enums";
import { balanceTeams } from "@/lib/balanceTeams";
import { PlayerToken } from "@/components/PlayerToken";
import { TeamDropZone } from "@/components/TeamDropZone";
import {
  DndContext,
  type DragEndEvent,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

interface Player {
  _id: string;
  name: string;
  rating: number;
  position: string;
  image?: string;
}

export default function PlayMatch() {
  const { id } = useParams();
  const router = useRouter();
  const [participants, setParticipants] = useState<Player[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [rating, setRating] = useState(50);
  const [position, setPosition] = useState("Centrocampista");
  const [adding, setAdding] = useState(false);
  const [teams, setTeams] = useState<{
    teamA: Player[];
    teamB: Player[];
  } | null>(null);
  const [starting, setStarting] = useState(false);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
  );

  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/tournaments/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setParticipants(data.participants);
    } catch {
      setError("Non riusciamo a caricare i giocatori. Riprova tra un momento.");
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    void fetchParticipants();
  }, [fetchParticipants]);
  const togglePlayer = (playerId: string) => {
    setSelected(
      selected.includes(playerId)
        ? selected.filter((p) => p !== playerId)
        : [...selected, playerId],
    );
    setTeams(null);
  };
  const addPlayer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || adding) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch(`/api/tournaments/${id}/players/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), position, rating }),
      });
      if (!res.ok) throw new Error();
      const player = await res.json();
      setParticipants([...participants, player]);
      setSelected([...selected, player._id]);
      setTeams(null);
      setName("");
    } catch {
      setError("Giocatore non aggiunto. Controlla la connessione e riprova.");
    } finally {
      setAdding(false);
    }
  };
  const movePlayer = (playerId: string, target: "A" | "B") => {
    if (!teams) return;
    const from = target === "A" ? "teamB" : "teamA";
    const to = target === "A" ? "teamA" : "teamB";
    const player = teams[from].find((p) => p._id === playerId);
    if (player)
      setTeams({
        ...teams,
        [from]: teams[from].filter((p) => p._id !== playerId),
        [to]: [...teams[to], player],
      });
  };
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && (over.id === "A" || over.id === "B"))
      movePlayer(String(active.id), over.id);
  };
  const startMatch = async () => {
    if (!teams || starting || !teams.teamA.length || !teams.teamB.length)
      return;
    setStarting(true);
    setError("");
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId: id,
          teamA: teams.teamA.map((p) => p._id),
          teamB: teams.teamB.map((p) => p._id),
          date: new Date(),
        }),
      });
      if (!res.ok) throw new Error();
      const game = await res.json();
      router.push(`/games/${game._id}`);
    } catch {
      setError("Partita non avviata. Puoi riprovare senza rifare le squadre.");
      setStarting(false);
    }
  };
  const average = (team: Player[]) =>
    team.length
      ? (team.reduce((sum, p) => sum + p.rating, 0) / team.length).toFixed(1)
      : "–";

  return (
    <div className="min-h-screen">
      <Navbar />
      <main id="main-content" className="page-width app-main">
        <Link href={`/tournaments/${id}`} className="breadcrumb-link">
          <Icon name="back" size={15} />
          Torna al torneo
        </Link>
        <div className="page-intro">
          <div>
            <p className="eyebrow">DAL GRUPPO AL CAMPO</p>
            <h1>Chi scende in campo?</h1>
            <p>
              Seleziona i presenti, prepara le squadre e dai il via alla
              partita.
            </p>
          </div>
          <span className="badge badge-primary">
            {selected.length} giocatori selezionati
          </span>
        </div>
        {error && (
          <div className="alert alert-error mb-6" role="alert">
            {error}
          </div>
        )}
        <div className="builder-layout">
          <div className="builder-sidebar">
            <section className="panel">
              <div className="panel-heading">
                <h2>
                  <span className="step-marker">1</span>Scegli i presenti
                </h2>
                {participants.length > 0 && (
                  <button
                    className="text-xs text-primary min-h-9"
                    onClick={() => {
                      setSelected(
                        selected.length === participants.length
                          ? []
                          : participants.map((p) => p._id),
                      );
                      setTeams(null);
                    }}
                  >
                    {selected.length === participants.length
                      ? "Deseleziona"
                      : "Tutti"}
                  </button>
                )}
              </div>
              {loading ? (
                <div className="loading-row" role="status">
                  <span className="loading loading-spinner loading-sm" />
                  Caricamento…
                </div>
              ) : participants.length ? (
                <div className="match-player-list">
                  {participants.map((p) => (
                    <label
                      key={p._id}
                      className={`match-player-option ${selected.includes(p._id) ? "is-selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-sm"
                        checked={selected.includes(p._id)}
                        onChange={() => togglePlayer(p._id)}
                      />
                      <span>
                        <strong>{p.name}</strong>
                        <small>{p.position}</small>
                      </span>
                      <span className="roster-rating">{p.rating}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="roster-empty">
                  <p>Non ci sono giocatori disponibili.</p>
                  <button
                    className="btn btn-ghost btn-sm mt-2"
                    onClick={fetchParticipants}
                  >
                    Ricarica
                  </button>
                </div>
              )}
            </section>
            <section className="panel">
              <div className="panel-heading">
                <h2>Si aggiunge un amico?</h2>
              </div>
              <form className="panel-body player-form" onSubmit={addPlayer}>
                <div className="form-control">
                  <label htmlFor="guest-name" className="field-label">
                    Nome del giocatore
                  </label>
                  <input
                    id="guest-name"
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={100}
                    placeholder="Es. Marco"
                  />
                </div>
                <div className="form-control">
                  <label htmlFor="guest-role" className="field-label">
                    Ruolo
                  </label>
                  <select
                    id="guest-role"
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
                    htmlFor="guest-rating"
                    className="field-label rating-label"
                  >
                    Valutazione
                    <span className="rating-value">{rating} / 100</span>
                  </label>
                  <input
                    id="guest-rating"
                    className="range range-primary range-sm"
                    type="range"
                    min="0"
                    max="100"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                  />
                </div>
                <p className="field-hint">
                  Il giocatore sarà aggiunto al torneo e selezionato per questa
                  partita.
                </p>
                <button
                  type="submit"
                  className="btn btn-outline"
                  disabled={adding || !name.trim()}
                >
                  <Icon name="plus" size={16} />
                  {adding ? "Aggiunta…" : "Aggiungi e seleziona"}
                </button>
              </form>
            </section>
          </div>
          <section className="panel builder-output">
            <div className="output-heading">
              <h2>
                <span className="step-marker">2</span>Prepara le formazioni
              </h2>
            </div>
            {teams ? (
              <div className="match-result">
                <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                  <div className="match-pitch">
                    <div className="pitch-boundary" aria-hidden="true">
                      <div className="pitch-half" />
                      <div className="pitch-circle" />
                      <div className="pitch-box pitch-box-top" />
                      <div className="pitch-box pitch-box-bottom" />
                    </div>
                    {(["A", "B"] as const).map((team, index) => {
                      const roster = index ? teams.teamB : teams.teamA;
                      return (
                        <TeamDropZone
                          key={team}
                          id={team}
                          className="match-team-half"
                        >
                          <h3 className="match-team-label">
                            Squadra {team}
                            <span>
                              {roster.length} giocatori · Media{" "}
                              {average(roster)}
                            </span>
                          </h3>
                          <div className="match-formation">
                            {positions.map((role) => (
                              <div className="formation-row" key={role}>
                                {roster
                                  .filter((p) => p.position === role)
                                  .map((p) => (
                                    <PlayerToken
                                      key={p._id}
                                      player={p}
                                      color={index ? "error" : "info"}
                                      onMove={() =>
                                        movePlayer(p._id, index ? "A" : "B")
                                      }
                                    />
                                  ))}
                              </div>
                            ))}
                          </div>
                        </TeamDropZone>
                      );
                    })}
                  </div>
                </DndContext>
                <p className="result-hint">
                  <Icon name="shuffle" size={15} />
                  Trascina i giocatori o usa la freccia sotto il nome per
                  cambiare squadra.
                </p>
              </div>
            ) : (
              <div className="empty-state builder-empty">
                <span className="empty-icon">
                  <Icon name="pitch" size={48} />
                </span>
                <h3>Prima i presenti, poi le squadre.</h3>
                <p>
                  Seleziona almeno 2 giocatori. Li divideremo in due formazioni
                  tenendo conto di ruoli e valutazioni.
                </p>
              </div>
            )}
            <div className="builder-footer">
              <button
                className="btn btn-outline w-full"
                disabled={selected.length < 2 || starting}
                onClick={() =>
                  setTeams(
                    balanceTeams(
                      participants.filter((p) => selected.includes(p._id)),
                    ),
                  )
                }
              >
                <Icon name="shuffle" size={17} />
                {teams ? "Rigenera le squadre" : "Crea squadre equilibrate"}
              </button>
              {teams && (
                <button
                  className="btn btn-primary w-full mt-3"
                  disabled={
                    starting || !teams.teamA.length || !teams.teamB.length
                  }
                  onClick={startMatch}
                >
                  {starting ? (
                    <>
                      <span className="loading loading-spinner loading-xs" />
                      Avvio della partita…
                    </>
                  ) : (
                    <>
                      Inizia la partita
                      <Icon name="arrow" size={17} />
                    </>
                  )}
                </button>
              )}
              <p>
                {selected.length < 2
                  ? "Seleziona almeno 2 giocatori per continuare."
                  : teams
                    ? "Avviando la partita potrai inserire i gol e votare l’MVP."
                    : `${selected.length} giocatori pronti per scendere in campo.`}
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
