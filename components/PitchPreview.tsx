import Icon from "./Icon";

const players = [
  { name: "Luca", number: 1, x: 50, y: 12 },
  { name: "Marco", number: 4, x: 25, y: 28 },
  { name: "Andrea", number: 6, x: 75, y: 28 },
  { name: "Paolo", number: 8, x: 32, y: 43 },
  { name: "Matteo", number: 10, x: 70, y: 43 },
  { name: "Davide", number: 9, x: 30, y: 59 },
  { name: "Simone", number: 7, x: 68, y: 59 },
  { name: "Fabio", number: 5, x: 25, y: 75 },
  { name: "Ale", number: 3, x: 75, y: 75 },
  { name: "Gio", number: 1, x: 50, y: 90 },
];

export default function PitchPreview() {
  return (
    <div className="pitch-preview">
      <div className="preview-topline">
        <span>
          <span className="status-dot" /> LA TUA PROSSIMA PARTITA
        </span>
        <span>5 vs 5</span>
      </div>
      <div className="preview-teamnames">
        <span>
          <i className="team-dot team-dot-a" /> Squadra A
        </span>
        <span className="versus">VS</span>
        <span>
          Squadra B <i className="team-dot team-dot-b" />
        </span>
      </div>
      <div
        className="tactical-pitch"
        role="img"
        aria-label="Esempio di due formazioni da cinque giocatori su un campo da calcio"
      >
        <div className="pitch-boundary">
          <div className="pitch-half" />
          <div className="pitch-circle" />
          <div className="pitch-box pitch-box-top" />
          <div className="pitch-box pitch-box-bottom" />
        </div>
        {players.map((p, i) => (
          <div
            key={p.name}
            className={`pitch-player ${i > 4 ? "pitch-player-b" : ""}`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <span className="player-shirt">{p.number}</span>
            <span className="pitch-player-name">{p.name}</span>
          </div>
        ))}
      </div>
      <div className="pitch-balance">
        <span className="balance-icon">
          <Icon name="check" size={18} />
        </span>
        <div>
          <strong>Stessa voglia di vincere. Stesso livello.</strong>
          <span>
            Rating medio <b>76</b> <span className="balance-separator">/</span>{" "}
            <b>76</b>
          </span>
        </div>
        <Icon name="shuffle" size={22} />
      </div>
      <p className="preview-caption">
        Esempio di formazione · I tuoi giocatori, le tue squadre
      </p>
    </div>
  );
}
