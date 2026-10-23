"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Icon from "@/components/Icon";
import { positions } from "@/models/enums";
import { balanceTeams } from "@/lib/balanceTeams";

interface Player {
  id: string;
  name: string;
  rating: number;
  position: string;
}

export default function TeamBalancer() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(50);
  const [position, setPosition] = useState("Centrocampista");
  const [teams, setTeams] = useState<{
    teamA: Player[];
    teamB: Player[];
  } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLElement>(null);

  const addPlayer = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setPlayers([
      ...players,
      { id: crypto.randomUUID(), name: name.trim(), rating, position },
    ]);
    setName("");
    setTeams(null);
    setAnnouncement(`${name.trim()} aggiunto al gruppo.`);
    nameRef.current?.focus();
  };
  const removePlayer = (id: string) => {
    setPlayers(players.filter((p) => p.id !== id));
    setTeams(null);
  };
  const generate = () => {
    if (players.length < 2) return;
    setTeams(balanceTeams(players));
    setAnnouncement(
      `Squadre pronte: ${Math.ceil(players.length / 2)} e ${Math.floor(players.length / 2)} giocatori.`,
    );
    requestAnimationFrame(() => outputRef.current?.focus());
  };
  const movePlayer = (player: Player, from: "teamA" | "teamB") => {
    if (!teams) return;
    const to = from === "teamA" ? "teamB" : "teamA";
    setTeams({
      ...teams,
      [from]: teams[from].filter((p) => p.id !== player.id),
      [to]: [...teams[to], player],
    });
    setAnnouncement(
      `${player.name} spostato nella squadra ${to === "teamA" ? "A" : "B"}.`,
    );
    requestAnimationFrame(() =>
      outputRef.current
        ?.querySelector<HTMLButtonElement>(`[data-move-player="${player.id}"]`)
        ?.focus({ preventScroll: true }),
    );
  };
  const average = (team: Player[]) =>
    team.length
      ? (team.reduce((sum, p) => sum + p.rating, 0) / team.length).toFixed(1)
      : "–";

  return (
    <div className="min-h-screen">
      <Navbar />
      <main id="main-content" className="page-width app-main">
        <div className="page-intro">
          <div>
            <p className="eyebrow">DUE SQUADRE. UNA BELLA PARTITA.</p>
            <h1>Le squadre si fanno qui.</h1>
            <p>
              Aggiungi chi gioca. Noi bilanciamo ruoli e valutazioni, tu pensi
              al campo.
            </p>
          </div>
          <span className="badge badge-primary">
            <Icon name="check" size={12} />
            Gratis · Nessun account richiesto
          </span>
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>
        <div className="builder-layout">
          <div className="builder-sidebar">
            <section className="panel">
              <div className="panel-heading">
                <h2>
                  <span className="step-marker">1</span>Aggiungi i giocatori
                </h2>
                <Icon name="users" size={18} className="text-primary" />
              </div>
              <form className="panel-body player-form" onSubmit={addPlayer}>
                <div className="form-control">
                  <label className="field-label" htmlFor="player-name">
                    Nome del giocatore
                  </label>
                  <input
                    ref={nameRef}
                    id="player-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                    placeholder="Es. Marco"
                    required
                    maxLength={60}
                    autoComplete="off"
                  />
                </div>
                <div className="form-control">
                  <label className="field-label" htmlFor="player-role">
                    Ruolo
                  </label>
                  <select
                    id="player-role"
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
                    className="field-label rating-label"
                    htmlFor="player-rating"
                  >
                    Valutazione
                    <span className="rating-value">{rating} / 100</span>
                  </label>
                  <input
                    id="player-rating"
                    type="range"
                    min="0"
                    max="100"
                    className="range range-primary range-sm"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                  />
                  <div className="range-legend">
                    <span>Principiante</span>
                    <span>Esperto</span>
                  </div>
                  <p className="field-hint">
                    Non sai cosa mettere? Parti da 50.
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={!name.trim()}
                >
                  <Icon name="plus" size={17} />
                  Aggiungi al gruppo
                </button>
              </form>
            </section>
            <section className="panel">
              <div className="panel-heading">
                <h2>
                  Il gruppo{" "}
                  <span className="badge badge-ghost">{players.length}</span>
                </h2>
                {players.length > 0 && (
                  <button
                    className="text-xs text-error min-h-9"
                    onClick={() => {
                      setPlayers([]);
                      setTeams(null);
                      setAnnouncement("Gruppo svuotato.");
                    }}
                  >
                    Svuota
                  </button>
                )}
              </div>
              {players.length ? (
                <ul className="roster-list">
                  {players.map((p) => (
                    <li key={p.id} className="roster-row">
                      <span className="roster-avatar">
                        {p.name.substring(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <strong>{p.name}</strong>
                        <small>{p.position}</small>
                      </div>
                      <span className="roster-rating">{p.rating}</span>
                      <button
                        className="icon-button"
                        aria-label={`Rimuovi ${p.name}`}
                        onClick={() => removePlayer(p.id)}
                      >
                        <Icon name="close" size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="roster-empty">
                  Il campo aspetta il vostro gruppo.
                  <br />
                  Inizia aggiungendo il primo giocatore.
                </p>
              )}
            </section>
          </div>
          <div>
            <section
              ref={outputRef}
              tabIndex={-1}
              className="panel builder-output"
              aria-label="Le tue formazioni"
            >
              <div className="output-heading">
                <h2>
                  <span className="step-marker">2</span>Le tue formazioni
                </h2>
                <span>{players.length} giocatori disponibili</span>
              </div>
              {teams ? (
                <div className="teams-result">
                  <div className="balance-status">
                    <Icon name="check" size={17} />
                    <span>
                      {!teams.teamA.length || !teams.teamB.length ? (
                        "Una squadra è vuota. Sposta un giocatore o rigenera le squadre."
                      ) : (
                        <>
                          Squadre pronte.{" "}
                          {players.length % 2
                            ? "Con un numero dispari, una squadra ha un giocatore in più."
                            : "Si può scendere in campo."}
                        </>
                      )}
                    </span>
                  </div>
                  <div className="teams-columns">
                    {(["teamA", "teamB"] as const).map((key, i) => (
                      <section
                        key={key}
                        className={`result-team ${i ? "result-team-b" : ""}`}
                      >
                        <header>
                          <h3>
                            <i
                              className={`team-dot ${i ? "team-dot-b" : "team-dot-a"}`}
                            />
                            Squadra {i ? "B" : "A"}
                          </h3>
                          <p>
                            {teams[key].length} giocatori · Media{" "}
                            {average(teams[key])}
                          </p>
                        </header>
                        {teams[key].length ? (
                          teams[key].map((p) => (
                            <div key={p.id} className="result-player">
                              <div>
                                <strong>{p.name}</strong>
                                <span>
                                  {p.position} · {p.rating}
                                </span>
                              </div>
                              <button
                                className="icon-button"
                                onClick={() => movePlayer(p, key)}
                                data-move-player={p.id}
                                aria-label={`Sposta ${p.name} nella squadra ${i ? "A" : "B"}`}
                                title={`Sposta nella squadra ${i ? "A" : "B"}`}
                              >
                                <Icon name={i ? "back" : "arrow"} size={16} />
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="team-empty">Nessun giocatore.</p>
                        )}
                      </section>
                    ))}
                  </div>
                  <p className="result-hint">
                    <Icon name="shuffle" size={15} />
                    Usa le frecce per cambiare squadra a un giocatore. Le medie
                    si aggiornano subito.
                  </p>
                </div>
              ) : (
                <div className="empty-state builder-empty">
                  <span className="empty-icon">
                    <Icon name="pitch" size={48} />
                  </span>
                  <h3>
                    {players.length >= 2
                      ? "Il gruppo c’è. Facciamo le squadre?"
                      : "Il campo è vostro."}
                  </h3>
                  <p>
                    {players.length >= 2
                      ? "Crea le formazioni con il pulsante qui sotto. Potrai spostare i giocatori anche dopo."
                      : "Aggiungi almeno 2 giocatori: troverai qui le due squadre, bilanciate per ruolo e livello."}
                  </p>
                </div>
              )}
              <div className="builder-footer">
                <button
                  className="btn btn-primary"
                  onClick={generate}
                  disabled={players.length < 2}
                >
                  <Icon name="shuffle" size={18} />
                  {teams ? "Rigenera le squadre" : "Crea squadre equilibrate"}
                </button>
                <p>
                  {players.length < 2
                    ? `${players.length === 1 ? "Manca" : "Mancano"} ${2 - players.length} giocator${players.length === 1 ? "e" : "i"} per iniziare.`
                    : "Ogni generazione prova una nuova combinazione di giocatori."}
                </p>
              </div>
            </section>
            <div className="builder-callout">
              <span>Vuoi conservare risultati e classifiche?</span>
              <Link href="/register">
                Crea un torneo
                <Icon name="arrow" size={15} />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
