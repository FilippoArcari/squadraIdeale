import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Turnament from "@/models/Turnament";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolvePointsRule, LEGACY_POINTS_RULE } from "@/lib/pointsRules";

/**
 * GET: restituisce lo storico completo delle regole punti e la regola
 * attualmente in vigore (risolta per currentSeason). Visibile a chiunque
 * abbia accesso al torneo, non solo all'owner: e' informazione, non azione.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;

        const tournament = await Turnament.findById(id).select("currentSeason pointsRuleHistory").lean();
        if (!tournament) {
            return NextResponse.json({ message: "Tournament not found" }, { status: 404 });
        }

        const currentSeason = (tournament as any).currentSeason || 1;
        const history = (tournament as any).pointsRuleHistory && (tournament as any).pointsRuleHistory.length > 0
            ? (tournament as any).pointsRuleHistory
            : [LEGACY_POINTS_RULE];

        return NextResponse.json({
            currentSeason,
            history,
            currentRule: resolvePointsRule(history, currentSeason),
        });
    } catch (error) {
        console.error("Error fetching points rules:", error);
        return NextResponse.json({ message: "Error fetching points rules" }, { status: 500 });
    }
}

/**
 * PATCH: imposta una nuova regola punti, effettiva dalla stagione CORRENTE in
 * poi. Non e' possibile modificare la regola di una stagione gia' chiusa
 * (season < currentSeason) da questo endpoint: e' una scelta deliberata, per
 * non permettere di riscrivere silenziosamente classifiche gia' pubblicate.
 * Se esiste gia' una voce per la stagione corrente (es. la regola e' stata
 * cambiata piu' volte nella stessa stagione, prima che si giocasse alcuna
 * partita), viene sovrascritta invece di accumulare duplicati.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        const { winner, loser, draw, absent } = await req.json();

        for (const [label, value] of [["winner", winner], ["loser", loser], ["draw", draw], ["absent", absent]] as const) {
            if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
                return NextResponse.json({ message: `Il valore per "${label}" deve essere un numero >= 0` }, { status: 400 });
            }
        }

        const tournament = await Turnament.findById(id);
        if (!tournament) {
            return NextResponse.json({ message: "Tournament not found" }, { status: 404 });
        }

        // @ts-ignore
        if (tournament.owner.toString() !== session.user.id) {
            return NextResponse.json({ message: "Only the owner can change the points rule" }, { status: 403 });
        }

        const currentSeason = tournament.currentSeason || 1;
        const existingHistory = tournament.pointsRuleHistory && tournament.pointsRuleHistory.length > 0
            ? tournament.pointsRuleHistory
            : [LEGACY_POINTS_RULE];

        const historyWithoutCurrentSeason = existingHistory.filter((r: any) => r.fromSeason !== currentSeason);
        tournament.pointsRuleHistory = [
            ...historyWithoutCurrentSeason,
            { fromSeason: currentSeason, winner, loser, draw, absent },
        ] as any;
        await tournament.save();

        return NextResponse.json({
            message: `Regola punti aggiornata a partire dalla Stagione ${currentSeason}`,
            currentSeason,
            newRule: { fromSeason: currentSeason, winner, loser, draw, absent },
        });
    } catch (error) {
        console.error("Error updating points rule:", error);
        return NextResponse.json({ message: "Error updating points rule" }, { status: 500 });
    }
}
