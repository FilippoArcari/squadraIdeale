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
 * 1. Coupling players by role, assigning the better player to the weaker team in that role.
 * 2. Distributing the remaining players one by one prioritizing strict numerical equality to ensure team size differs by at most 1.
 * 
 * @param players Array of players to balance
 * @returns Object containing teamA and teamB arrays
 */
export function balanceTeams<T extends PlayerWithRating>(players: T[]): BalanceTeamsResult<T> {
    const tA: T[] = [];
    const tB: T[] = [];

    // Track stats
    const roleRatingA: Record<string, number> = {};
    const roleRatingB: Record<string, number> = {};
    let totalRatingA = 0;
    let totalRatingB = 0;

    // Initialize role ratings
    positions.forEach(pos => {
        roleRatingA[pos] = 0;
        roleRatingB[pos] = 0;
    });

    // Helper to add a player to a team
    const addToTeam = (team: 'A' | 'B', player: T) => {
        if (team === 'A') {
            tA.push(player);
            if (roleRatingA[player.position] !== undefined) {
                roleRatingA[player.position] += player.rating;
            }
            totalRatingA += player.rating;
        } else {
            tB.push(player);
            if (roleRatingB[player.position] !== undefined) {
                roleRatingB[player.position] += player.rating;
            }
            totalRatingB += player.rating;
        }
    };

    // Group and sort by position with randomness
    const playersByPosition: Record<string, T[]> = {};
    positions.forEach(pos => {
        playersByPosition[pos] = players.filter(p => p.position === pos);
        playersByPosition[pos].sort((a, b) => {
            const randomFactorA = (Math.random() - 0.5) * 10;
            const randomFactorB = (Math.random() - 0.5) * 10;
            return (b.rating + randomFactorB) - (a.rating + randomFactorA);
        });
    });

    const unpairedPlayers: T[] = [];

    positions.forEach(pos => {
        const rolePlayers = playersByPosition[pos] || [];

        for (let i = 0; i < rolePlayers.length; i += 2) {
            if (i + 1 < rolePlayers.length) {
                // We have a pair
                const p1 = rolePlayers[i];
                const p2 = rolePlayers[i + 1];

                // Decide which gets p1 (the better one)
                if (roleRatingA[pos] < roleRatingB[pos]) {
                    addToTeam('A', p1);
                    addToTeam('B', p2);
                } else if (roleRatingB[pos] < roleRatingA[pos]) {
                    addToTeam('B', p1);
                    addToTeam('A', p2);
                } else {
                    // Role ratings equal, use total rating
                    if (totalRatingA <= totalRatingB) {
                        addToTeam('A', p1);
                        addToTeam('B', p2);
                    } else {
                        addToTeam('B', p1);
                        addToTeam('A', p2);
                    }
                }
            } else {
                // Odd one out
                unpairedPlayers.push(rolePlayers[i]);
            }
        }
    });

    // Sort unpaired players by rating descending (with some randomness)
    unpairedPlayers.sort((a, b) => {
        const randomFactorA = (Math.random() - 0.5) * 10;
        const randomFactorB = (Math.random() - 0.5) * 10;
        return (b.rating + randomFactorB) - (a.rating + randomFactorA);
    });

    // Distribute unpaired players
    unpairedPlayers.forEach(p => {
        const pos = p.position;

        if (tA.length < tB.length) {
            addToTeam('A', p);
        } else if (tB.length < tA.length) {
            addToTeam('B', p);
        } else {
            // Same number of players, decide based on role
            if (roleRatingA[pos] !== undefined && roleRatingB[pos] !== undefined) {
                if (roleRatingA[pos] < roleRatingB[pos]) {
                    addToTeam('A', p);
                } else if (roleRatingB[pos] < roleRatingA[pos]) {
                    addToTeam('B', p);
                } else {
                    // Fallback to total rating
                    if (totalRatingA <= totalRatingB) {
                        addToTeam('A', p);
                    } else {
                        addToTeam('B', p);
                    }
                }
            } else {
                if (totalRatingA <= totalRatingB) {
                    addToTeam('A', p);
                } else {
                    addToTeam('B', p);
                }
            }
        }
    });

    return { teamA: tA, teamB: tB };
}
