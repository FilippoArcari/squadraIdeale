import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Turnament from "@/models/Turnament";
import Player from "@/models/Player";
import { computeSeasonStats } from "@/lib/seasonStats";

/**
 * Imposta i punti "visualizzati" di un giocatore per la stagione corrente al
 * valore desiderato dall'admin. Con l'introduzione delle stagioni, i punti non
 * sono piu' un contatore libero: sono (vittorie*3 + pareggi*1), derivato dalle
 * Game della stagione (vedi lib/seasonStats.ts). Per non perdere la possibilita'
 * di dare bonus/penalita' manuali, la differenza tra il valore richiesto e il
 * valore calcolato automaticamente viene salvata come rettifica scoped alla
 * stagione in Player.pointAdjustments, invece di sovrascrivere uno stats.points
 * assoluto che ora sarebbe ignorato in lettura.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; playerId: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { id, playerId } = await params;
        const { points } = await req.json();

        if (typeof points !== "number" || !Number.isFinite(points)) {
            return NextResponse.json({ message: "points must be a number" }, { status: 400 });
        }

        // Verify user is tournament owner or admin
        const tournament = await Turnament.findById(id).populate("admins");
        if (!tournament) {
            return NextResponse.json({ message: "Tournament not found" }, { status: 404 });
        }

        const userId = (session.user as any).id;
        const isOwner = tournament.owner.toString() === userId;
        const isAdmin = tournament.admins.some((admin: any) => admin.userId?.toString() === userId);

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ message: "Only tournament owner or admins can manage points" }, { status: 403 });
        }

        const season = tournament.currentSeason || 1;

        // Calcolo i punti che risulterebbero SOLO dalle partite (senza le
        // rettifiche gia' esistenti), per capire quale delta serve per
        // raggiungere esattamente il valore richiesto dall'admin.
        const seasonStats = await computeSeasonStats(id, season);
        const existingPlayer = await Player.findById(playerId).select("pointAdjustments");
        if (!existingPlayer) {
            return NextResponse.json({ message: "Player not found" }, { status: 404 });
        }
        const existingAdjustmentTotal = (existingPlayer.pointAdjustments || [])
            .filter((adj: any) => adj.season === season)
            .reduce((sum: number, adj: any) => sum + (adj.delta || 0), 0);
        const pointsFromGamesOnly = (seasonStats.get(playerId)?.points || 0) - existingAdjustmentTotal;

        const newDelta = points - pointsFromGamesOnly;

        // Sostituisco l'eventuale rettifica precedente per questa stagione con una sola voce.
        const otherSeasonsAdjustments = (existingPlayer.pointAdjustments || []).filter(
            (adj: any) => adj.season !== season
        );
        existingPlayer.pointAdjustments = [
            ...otherSeasonsAdjustments,
            ...(newDelta !== 0 ? [{ season, delta: newDelta }] : []),
        ];
        await existingPlayer.save();

        return NextResponse.json({
            message: "Punti aggiornati per la stagione corrente",
            season,
            resultingPoints: points,
            adjustmentDelta: newDelta,
        });
    } catch (error) {
        console.error("Error updating player points:", error);
        return NextResponse.json({ message: "Error updating points" }, { status: 500 });
    }
}
