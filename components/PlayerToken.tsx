interface Player {
    _id?: string;
    id?: string;
    name: string;
    rating: number;
    position: string;
    image?: string;
}

interface PlayerTokenProps {
    player: Player;
    color: "info" | "error";
    onDragStart?: (player: Player) => void;
    onDragEnd?: () => void;
}

export const PlayerToken = ({
    player,
    color,
    onDragStart,
    onDragEnd
}: PlayerTokenProps) => (
    <div
        className="flex flex-col items-center group relative z-10 transition-transform hover:scale-110 cursor-grab active:cursor-grabbing"
        draggable={!!onDragStart}
        onDragStart={() => onDragStart?.(player)}
        onDragEnd={onDragEnd}
    >
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-${color} bg-base-100 overflow-hidden shadow-lg relative`}>
            {player.image ? (
                <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-xs font-bold">
                    {player.name.substring(0, 2).toUpperCase()}
                </div>
            )}
        </div>
        <div className="mt-1 bg-black/60 text-white text-[9px] md:text-[10px] px-2 py-0.5 rounded-full backdrop-blur-md font-medium text-center max-w-[80px] truncate shadow-sm border border-white/10">
            {player.name}
        </div>
        <div className={`absolute -top-2 -right-2 bg-${color} text-white text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md border border-white/20`}>
            {player.rating}
        </div>
    </div>
);
