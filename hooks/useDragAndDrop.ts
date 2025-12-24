import { useState } from 'react';

interface Player {
    _id?: string;
    id?: string;
    name: string;
    rating: number;
    position: string;
    image?: string;
}

export function useDragAndDrop<T extends Player>(
    teamA: T[],
    teamB: T[],
    setTeamA: (team: T[]) => void,
    setTeamB: (team: T[]) => void
) {
    const [draggedPlayer, setDraggedPlayer] = useState<T | null>(null);

    const handleDragStart = (player: T) => {
        setDraggedPlayer(player);
    };

    const handleDragEnd = () => {
        setDraggedPlayer(null);
    };

    const handleDropOnTeam = (targetTeam: 'A' | 'B') => {
        if (!draggedPlayer) return;

        const playerId = draggedPlayer._id || draggedPlayer.id;
        const sourceIsTeamA = teamA.some(p => (p._id || p.id) === playerId);
        const sourceIsTeamB = teamB.some(p => (p._id || p.id) === playerId);

        if (targetTeam === 'A' && sourceIsTeamB) {
            // Move from Team B to Team A
            setTeamB(teamB.filter(p => (p._id || p.id) !== playerId));
            setTeamA([...teamA, draggedPlayer]);
        } else if (targetTeam === 'B' && sourceIsTeamA) {
            // Move from Team A to Team B
            setTeamA(teamA.filter(p => (p._id || p.id) !== playerId));
            setTeamB([...teamB, draggedPlayer]);
        }

        // Clear dragged player after drop
        setDraggedPlayer(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Required to allow drop
    };

    return {
        draggedPlayer,
        isDragging: draggedPlayer !== null,
        handleDragStart,
        handleDragEnd,
        handleDropOnTeam,
        handleDragOver,
    };
}
