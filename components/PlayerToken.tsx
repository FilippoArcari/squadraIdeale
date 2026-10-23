import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import Icon from "./Icon";

interface Player {
  _id?: string;
  id?: string;
  name: string;
  rating: number;
  position: string;
  image?: string;
}

export function PlayerToken({
  player,
  color,
  onMove,
}: {
  player: Player;
  color: "info" | "error";
  onMove?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: player._id || player.id || "", data: { player } });
  return (
    <div
      className={`match-token ${color === "error" ? "match-token-b" : ""}`}
      style={{
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : 10,
        opacity: isDragging ? 0.6 : 1,
      }}
    >
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        aria-label={`${player.name}, valutazione ${player.rating}`}
        className="match-token-drag"
      >
        {player.image ? (
          <Image
            src={player.image}
            alt=""
            width={33}
            height={33}
            unoptimized
            className="match-token-avatar"
          />
        ) : (
          <span className="match-token-avatar">
            {player.name.substring(0, 2).toUpperCase()}
          </span>
        )}
        <span className="match-token-rating">{player.rating}</span>
      </div>
      <span className="match-token-name">{player.name}</span>
      {onMove && (
        <button
          type="button"
          className="match-token-move"
          onClick={onMove}
          aria-label={`Sposta ${player.name} nell’altra squadra`}
          title="Cambia squadra"
        >
          <Icon name="shuffle" size={12} />
        </button>
      )}
    </div>
  );
}
