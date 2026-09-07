import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Player from "@/models/Player";

/**
 * Migration endpoint to recalculate points for all players
 * Call: GET /api/admin/recalculate-points
 *
 * ATTENZIONE (post feature "regole punti versionate per stagione"): questo
 * endpoint usa una formula fissa (wins*3 + draws*1) su Player.stats.wins/draws
 * gia' aggregati, che non distinguono in quale stagione/torneo sono avvenuti.
 * Con Turnament.pointsRuleHistory diverso per stagione, questa formula NON e'
 * piu' corretta in generale (ignora anche le sconfitte, che ora possono valere
 * punti). Non e' referenziata da nessuna pagina del frontend (verificato con
 * grep): e' rimasta come vecchio strumento di migrazione. Per ricostruire
 * correttamente le statistiche all-time usa scripts/recalculate_stats.js, che
 * e' stato aggiornato per risolvere la regola corretta partita per partita.
 */
export async function GET() {
    try {
        await dbConnect();

        const players = await Player.find({});
        let updatedCount = 0;

        for (const player of players) {
            const wins = player.stats?.wins || 0;
            const draws = player.stats?.draws || 0;
            const calculatedPoints = (wins * 3) + (draws * 1);

            await Player.findByIdAndUpdate(player._id, {
                $set: { 'stats.points': calculatedPoints }
            });

            updatedCount++;
        }

        return NextResponse.json({
            message: "Points recalculated successfully",
            playersUpdated: updatedCount
        });
    } catch (error) {
        console.error("Error recalculating points:", error);
        return NextResponse.json({
            message: "Error recalculating points",
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
