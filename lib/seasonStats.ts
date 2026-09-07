import mongoose from "mongoose";
import Game from "@/models/Game";
import Player from "@/models/Player";
import Turnament from "@/models/Turnament";
import { resolvePointsRule, pointsForOutcome, outcomeFor } from "@/lib/pointsRules";

/**
 * Statistiche di un giocatore derivate esclusivamente dalle partite (Game)
 * finalizzate di UNA specifica stagione. Queste vengono sempre ricalcolate al
 * volo aggregando i documenti Game: non esiste alcun contatore persistito che
 * possa andare fuori sincrono, a differenza di Player.stats (che resta un
 * aggregato "all-time" mantenuto con $inc in app/api/games/[id]/finalize e
 * app/api/games/[id]/route.ts, e che il progetto stesso ha gia' dovuto
 * ricostruire da zero una volta con scripts/recalculate_stats.js).
 */
export interface SeasonPlayerStats {
    playerId: string;
    goals: number;
    mvps: number;
    gamesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    points: number;
}

export interface SeasonSummary {
    season: number;
    gamesPlayed: number;
    standings: SeasonPlayerStats[]; // ordinate per punti, poi differenza reti implicita (goals)
    topScorer: SeasonPlayerStats | null;
    topMvp: SeasonPlayerStats | null;
}

function emptyStats(playerId: string): SeasonPlayerStats {
    return {
        playerId,
        goals: 0,
        mvps: 0,
        gamesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
    };
}

/**
 * Calcola le statistiche per-giocatore di una singola stagione di un torneo,
 * rigiocando tutte le Game finalizzate con quel numero di stagione.
 *
 * I punti usano la regola versionata risolta da lib/pointsRules.ts in base al
 * numero di stagione: stagioni diverse possono avere formule diverse (vedi
 * Turnament.pointsRuleHistory), cosi' cambiare la formula "da ora in poi" non
 * altera le classifiche delle stagioni gia' chiuse.
 */
export async function computeSeasonStats(
    tournamentId: string | mongoose.Types.ObjectId,
    season: number
): Promise<Map<string, SeasonPlayerStats>> {
    const games = await Game.find({
        turnament: tournamentId,
        season,
        isFinalized: true,
    }).lean();

    // Fetch del torneo una sola volta: serve sia per risolvere quale regola
    // punti era in vigore in questa stagione, sia (piu' sotto) per le rettifiche
    // manuali, che riguardano tutti i partecipanti.
    const tournament = await Turnament.findById(tournamentId)
        .select("participants pointsRuleHistory")
        .lean();
    const rule = resolvePointsRule((tournament as any)?.pointsRuleHistory, season);

    const statsByPlayer = new Map<string, SeasonPlayerStats>();

    const getOrCreate = (playerId: string): SeasonPlayerStats => {
        let s = statsByPlayer.get(playerId);
        if (!s) {
            s = emptyStats(playerId);
            statsByPlayer.set(playerId, s);
        }
        return s;
    };

    for (const game of games as any[]) {
        // Gol
        for (const goal of game.goals || []) {
            if (!goal.player) continue;
            const s = getOrCreate(goal.player.toString());
            s.goals += goal.count || 0;
        }

        // MVP
        if (game.mvp) {
            const s = getOrCreate(game.mvp.toString());
            s.mvps += 1;
        }

        // Vittorie / pareggi / sconfitte / punti
        const teamAIds: string[] = (game.teamA || []).map((p: any) => p.toString());
        const teamBIds: string[] = (game.teamB || []).map((p: any) => p.toString());
        const allPlayers = [...teamAIds, ...teamBIds];

        let winningTeam: string[] = [];
        if (game.manualWinner) {
            if (game.manualWinner === "teamA") winningTeam = teamAIds;
            else if (game.manualWinner === "teamB") winningTeam = teamBIds;
            // "draw" -> winningTeam resta vuoto
        } else {
            let scoreA = 0;
            let scoreB = 0;
            (game.goals || []).forEach((g: any) => {
                if (!g.player) return;
                const pid = g.player.toString();
                if (teamAIds.includes(pid)) scoreA += g.count || 0;
                if (teamBIds.includes(pid)) scoreB += g.count || 0;
            });
            winningTeam = scoreA > scoreB ? teamAIds : scoreB > scoreA ? teamBIds : [];
        }

        for (const playerId of allPlayers) {
            const isWinner = winningTeam.includes(playerId);
            const isDraw = winningTeam.length === 0;
            const isLoser = !isWinner && !isDraw;
            const points = pointsForOutcome(rule, outcomeFor(isWinner, isDraw));

            const s = getOrCreate(playerId);
            s.gamesPlayed += 1;
            if (isWinner) s.wins += 1;
            if (isDraw) s.draws += 1;
            if (isLoser) s.losses += 1;
            s.points += points;
        }
    }

    // Applico eventuali rettifiche manuali ai punti (tab "Gestione Punti"
    // dell'admin), scoped alla stagione richiesta. Vanno cercate su TUTTI i
    // partecipanti del torneo, non solo su chi ha giocato una partita in questa
    // stagione: un admin potrebbe voler dare un bonus anche a chi non ha ancora
    // disputato partite.
    const participantIds = ((tournament as any)?.participants || []).map((p: any) => p.toString());

    if (participantIds.length > 0) {
        const playersWithAdjustments = await Player.find({
            _id: { $in: participantIds },
            "pointAdjustments.season": season,
        })
            .select("pointAdjustments")
            .lean();

        for (const player of playersWithAdjustments as any[]) {
            const totalDelta = (player.pointAdjustments || [])
                .filter((adj: any) => adj.season === season)
                .reduce((sum: number, adj: any) => sum + (adj.delta || 0), 0);

            if (totalDelta !== 0) {
                const s = getOrCreate(player._id.toString());
                s.points += totalDelta;
            }
        }
    }

    return statsByPlayer;
}

/**
 * Costruisce il riepilogo di una stagione (classifica, capocannoniere, MVP)
 * a partire dalla mappa di statistiche calcolata da computeSeasonStats.
 */
export function buildSeasonSummary(
    season: number,
    statsByPlayer: Map<string, SeasonPlayerStats>,
    gamesPlayedCount: number
): SeasonSummary {
    const standings = Array.from(statsByPlayer.values()).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goals !== a.goals) return b.goals - a.goals;
        return b.wins - a.wins;
    });

    const topScorer =
        standings.length > 0
            ? standings.reduce((max, p) => (p.goals > max.goals ? p : max), standings[0])
            : null;

    const topMvp =
        standings.length > 0
            ? standings.reduce((max, p) => (p.mvps > max.mvps ? p : max), standings[0])
            : null;

    return {
        season,
        gamesPlayed: gamesPlayedCount,
        standings,
        topScorer: topScorer && topScorer.goals > 0 ? topScorer : null,
        topMvp: topMvp && topMvp.mvps > 0 ? topMvp : null,
    };
}
