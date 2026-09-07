import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Turnament from "@/models/Turnament";
import Player from "@/models/Player";
import Game from "@/models/Game";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { computeSeasonStats, buildSeasonSummary } from "@/lib/seasonStats";

/**
 * GET: restituisce il riepilogo di TUTTE le stagioni del torneo (1..currentSeason),
 * ciascuna con classifica, capocannoniere e MVP. E' lo storico visibile a
 * qualunque partecipante (non solo all'owner), coerentemente con la richiesta
 * di avere i risultati passati consultabili da tutti.
 *
 * Le statistiche di ogni stagione, incluse quelle passate, sono ricalcolate al
 * volo dagli eventi Game (vedi lib/seasonStats.ts) invece di essere lette da uno
 * snapshot salvato: questo evita di dover "congelare" nulla quando si chiude una
 * stagione, e mantiene un'unica fonte di verita' per tutte le stagioni, passate
 * o presenti.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;

        Player;
        Game;

        const tournament = await Turnament.findById(id).populate(
            "participants",
            "name image"
        );
        if (!tournament) {
            return NextResponse.json({ message: "Tournament not found" }, { status: 404 });
        }

        // Solo owner o partecipanti possono vedere lo storico.
        // @ts-ignore
        const userId = session.user.id as string;
        const isOwner = tournament.owner.toString() === userId;
        const userPlayerIds = await Player.find({ userId }).distinct("_id");
        const isParticipant = (tournament.participants as any[]).some((p: any) =>
            userPlayerIds.map((pid) => pid.toString()).includes(p._id.toString())
        );
        if (!isOwner && !isParticipant) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const currentSeason = tournament.currentSeason || 1;
        const playerNameById = new Map(
            (tournament.participants as any[]).map((p: any) => [p._id.toString(), { name: p.name, image: p.image }])
        );

        const seasons = [];
        for (let season = 1; season <= currentSeason; season++) {
            const gamesCount = await Game.countDocuments({
                turnament: id,
                season,
                isFinalized: true,
            });
            const statsByPlayer = await computeSeasonStats(id, season);
            const summary = buildSeasonSummary(season, statsByPlayer, gamesCount);

            // Arricchisco ogni riga della classifica col nome del giocatore
            // (potrebbe non essere piu' tra i participants attuali se rimosso: in quel
            // caso mostriamo un'etichetta di fallback, dato che i Player rimossi
            // vengono cancellati fisicamente - vedi DELETE /players/[playerId]).
            const enrich = (row: any) =>
                row && {
                    ...row,
                    name: playerNameById.get(row.playerId)?.name || "Giocatore rimosso",
                    image: playerNameById.get(row.playerId)?.image,
                };

            seasons.push({
                ...summary,
                standings: summary.standings.map(enrich),
                topScorer: enrich(summary.topScorer),
                topMvp: enrich(summary.topMvp),
                isCurrent: season === currentSeason,
            });
        }

        // Le stagioni piu' recenti per prime.
        seasons.reverse();

        return NextResponse.json({ currentSeason, seasons });
    } catch (error) {
        console.error("Error fetching season history:", error);
        return NextResponse.json(
            {
                message: "Error fetching season history",
                error: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}

/**
 * POST: avvia una nuova stagione, incrementando Turnament.currentSeason di 1.
 * Operazione riservata all'owner del torneo (stesso pattern di /deactivate).
 *
 * Nota architetturale: questa operazione NON tocca ne' Player.stats ne' i
 * documenti Game esistenti. Non c'e' nulla da "archiviare": le partite gia'
 * giocate restano taggate con il loro season originale per sempre, e diventano
 * automaticamente storico semplicemente perche' non sono piu' la stagione corrente.
 * Le nuove Game create dopo questa chiamata verranno taggate con il nuovo
 * currentSeason (vedi app/api/tournaments/[id]/games/route.ts).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;

        const tournament = await Turnament.findById(id);
        if (!tournament) {
            return NextResponse.json({ message: "Tournament not found" }, { status: 404 });
        }

        // @ts-ignore
        if (tournament.owner.toString() !== session.user.id) {
            return NextResponse.json(
                { message: "Only the owner can start a new season" },
                { status: 403 }
            );
        }

        const previousSeason = tournament.currentSeason || 1;

        // $inc atomico invece di leggere-modificare-salvare: se l'owner facesse
        // doppio click o partissero due richieste concorrenti, un read-modify-write
        // rischierebbe di applicare l'incremento una volta sola (lost update).
        const updated = await Turnament.findByIdAndUpdate(
            id,
            { $inc: { currentSeason: 1 } },
            { new: true }
        );

        return NextResponse.json({
            message: "Nuova stagione avviata",
            previousSeason,
            currentSeason: updated?.currentSeason,
        });
    } catch (error) {
        console.error("Error starting new season:", error);
        return NextResponse.json(
            {
                message: "Error starting new season",
                error: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
