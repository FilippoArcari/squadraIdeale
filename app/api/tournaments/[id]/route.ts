import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Turnament from "@/models/Turnament";
import Player from "@/models/Player";
import Game from "@/models/Game";
import { generateJoinCode } from "@/lib/generateJoinCode";
import { computeSeasonStats } from "@/lib/seasonStats";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const { searchParams } = new URL(req.url);

        // Ensure models are registered
        Player;
        Game;

        const tournament = await Turnament.findById(id)
            .populate("participants", "name position rating stats image userId")
            .populate({
                path: "games",
                populate: [
                    { path: "teamA", select: "name image" },
                    { path: "teamB", select: "name image" },
                    { path: "scorer", select: "name image" },
                    { path: "mvp", select: "name image" }
                ]
            });
        if (!tournament) {
            return NextResponse.json({ message: "Tournament not found" }, { status: 404 });
        }

        // Stagione richiesta: di default quella in corso. Un chiamante puo'
        // chiedere esplicitamente ?season=N per vedere (in sola lettura) una
        // stagione passata, ad es. dalla pagina di storico.
        const currentSeason = tournament.currentSeason || 1;
        const requestedSeasonParam = searchParams.get("season");
        const requestedSeason = requestedSeasonParam ? parseInt(requestedSeasonParam, 10) : currentSeason;
        const season = Number.isFinite(requestedSeason) && requestedSeason > 0 ? requestedSeason : currentSeason;

        // Le partite mostrate sono solo quelle della stagione richiesta.
        const seasonGames = (tournament.games as any[]).filter((g: any) => (g.season || 1) === season);

        // Le statistiche per-giocatore sono SEMPRE derivate dagli eventi Game di
        // quella stagione (fonte di verita'), non lette da Player.stats
        // (che resta un aggregato all-time, mai azzerato tra una stagione e l'altra).
        const seasonStatsByPlayer = await computeSeasonStats(id, season);
        const participantsWithSeasonStats = (tournament.participants as any[]).map((p: any) => {
            const s = seasonStatsByPlayer.get(p._id.toString());
            const plain = p.toObject ? p.toObject() : p;
            return {
                ...plain,
                // "stats" nella risposta rappresenta ora la stagione richiesta, non l'all-time.
                stats: {
                    goals: s?.goals || 0,
                    mvps: s?.mvps || 0,
                    gamesPlayed: s?.gamesPlayed || 0,
                    wins: s?.wins || 0,
                    draws: s?.draws || 0,
                    losses: s?.losses || 0,
                    points: s?.points || 0,
                },
                allTimeStats: plain.stats, // conservato per chi vuole ancora il totale storico del giocatore
            };
        });

        // Generate join code if missing (for backward compatibility)
        if (!tournament.joinCode) {
            let joinCode = generateJoinCode();
            let isUnique = false;
            let attempts = 0;
            const maxAttempts = 10;

            while (!isUnique && attempts < maxAttempts) {
                const existing = await Turnament.findOne({ joinCode });
                if (!existing) {
                    isUnique = true;
                } else {
                    joinCode = generateJoinCode();
                    attempts++;
                }
            }

            if (isUnique) {
                tournament.joinCode = joinCode;
                await tournament.save();
            }
        }

        const responseBody = {
            ...tournament.toObject(),
            games: seasonGames,
            participants: participantsWithSeasonStats,
            season,
            currentSeason,
        };

        return NextResponse.json(responseBody);
    } catch (error) {
        console.error("Error fetching tournament details:", error);
        return NextResponse.json({
            message: "Error fetching tournament details",
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
