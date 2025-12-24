import { positions } from '../models/enums';

interface PlayerWithRating {
    rating: number;
    position: string;
}

interface BalanceTeamsResult<T extends PlayerWithRating> {
    teamA: T[];
    teamB: T[];
}

/**
 * Balances players into two teams based on their positions and ratings.
 * Ensures fair distribution by:
 * 1. Distributing goalkeepers first (max 1 per team)
 * 2. Using a greedy algorithm to distribute remaining players by rating
 * 3. Adding randomness to prevent identical team formations
 * 
 * @param players Array of players to balance
 * @returns Object containing teamA and teamB arrays
 */
export function balanceTeams<T extends PlayerWithRating>(players: T[]): BalanceTeamsResult<T> {
    // Group players by position
    const playersByPosition: Record<string, T[]> = {};

    positions.forEach(pos => {
        playersByPosition[pos] = players.filter(p => p.position === pos);
        // Sort each position by rating (descending) with slight shuffle for randomness
        playersByPosition[pos].sort((a, b) => {
            // Add some randomness to the sorting (±5 rating points variance)
            const randomFactorA = (Math.random() - 0.5) * 10;
            const randomFactorB = (Math.random() - 0.5) * 10;
            return (b.rating + randomFactorB) - (a.rating + randomFactorA);
        });
    });

    const tA: T[] = [];
    const tB: T[] = [];
    let ratingA = 0;
    let ratingB = 0;

    // Extract goalkeepers and outfield players
    const goalkeepers = playersByPosition['Portiere'] || [];
    const outfieldPlayers = [
        ...(playersByPosition['Difensore'] || []),
        ...(playersByPosition['Centrocampista'] || []),
        ...(playersByPosition['Attaccante'] || []),
        ...(playersByPosition['Jolly'] || [])
    ];

    // Distribute Goalkeepers first (Max 1 per team if possible)
    goalkeepers.forEach((gk) => {
        const hasGKA = tA.some(p => p.position === 'Portiere');
        const hasGKB = tB.some(p => p.position === 'Portiere');

        if (!hasGKA) {
            tA.push(gk);
            ratingA += gk.rating;
        } else if (!hasGKB) {
            tB.push(gk);
            ratingB += gk.rating;
        } else {
            // Both have GK, balance by rating
            if (ratingA <= ratingB) {
                tA.push(gk);
                ratingA += gk.rating;
            } else {
                tB.push(gk);
                ratingB += gk.rating;
            }
        }
    });

    // Distribute remaining players using greedy algorithm
    outfieldPlayers.forEach((player) => {
        if (ratingA <= ratingB) {
            tA.push(player);
            ratingA += player.rating;
        } else {
            tB.push(player);
            ratingB += player.rating;
        }
    });

    return { teamA: tA, teamB: tB };
}
