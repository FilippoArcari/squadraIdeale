                                                                                                                                        import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Game from "@/models/Game";
import Player from "@/models/Player";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolvePointsRule, pointsForOutcome, outcomeFor } from "@/lib/pointsRules";

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const game = await Game.findById(id)
            .populate("teamA", "name image")
            .populate("teamB", "name image")
            .populate("mvp", "name image")
            .populate({
                path: "turnament",
                select: "owner"
            });

        if (!game) {
            return NextResponse.json({ message: "Game not found" }, { status: 404 });
        }

        return NextResponse.json(game);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching game" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);

        const { date, goals, mvp, manualWinner } = await req.json();
        await dbConnect();
        const { id } = await params;

        const game = await Game.findById(id).populate("turnament");
        if (!game) {
            return NextResponse.json({ message: "Game not found" }, { status: 404 });
        }

        // Verify ownership
        if (!session || ((session.user as any).id !== game.turnament.owner.toString())) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        // Regola punti in vigore per la STAGIONE di questa partita (non quella
        // corrente del torneo): garantisce che modificare una partita di una
        // stagione ormai chiusa continui a usare la formula di allora.
        // game.turnament e' gia' popolato per intero (vedi query sopra), quindi
        // pointsRuleHistory e' gia' disponibile senza una query aggiuntiva.
        const rule = resolvePointsRule((game.turnament as any).pointsRuleHistory, game.season || 1);

        // If the game is already finalized, we need to subtract the old stats before updating
        if (game.isFinalized) {
            // Subtract goals
            for (const goal of game.goals) {
                await Player.findByIdAndUpdate(goal.player, {
                    $inc: { "stats.goals": -goal.count }
                });
            }

            // Subtract MVP
            if (game.mvp) {
                await Player.findByIdAndUpdate(game.mvp, {
                    $inc: { "stats.mvps": -1 }
                });
            }

            // Subtract match results
            const teamAIds = game.teamA.map((id: any) => id.toString());
            const teamBIds = game.teamB.map((id: any) => id.toString());
            const allPlayers = [...teamAIds, ...teamBIds];

            let scoreA = 0;
            let scoreB = 0;
            let winningTeam: string[] = [];

            if (game.manualWinner) {
                if (game.manualWinner === 'teamA') winningTeam = teamAIds;
                else if (game.manualWinner === 'teamB') winningTeam = teamBIds;
            } else {
                game.goals.forEach((g: any) => {
                    if (teamAIds.includes(g.player.toString())) scoreA += g.count;
                    if (teamBIds.includes(g.player.toString())) scoreB += g.count;
                });
                winningTeam = scoreA > scoreB ? teamAIds : (scoreB > scoreA ? teamBIds : []);
            }

            for (const playerId of allPlayers) {
                const isWinner = winningTeam.includes(playerId);
                const isDraw = winningTeam.length === 0;
                const points = pointsForOutcome(rule, outcomeFor(isWinner, isDraw));

                await Player.findByIdAndUpdate(playerId, {
                    $inc: {
                        "stats.gamesPlayed": -1,
                        "stats.wins": isWinner ? -1 : 0,
                        "stats.draws": isDraw ? -1 : 0,
                        "stats.losses": (!isWinner && !isDraw) ? -1 : 0,
                        "stats.points": -points
                    }
                });
            }
        }

        // Update fields
        if (date) game.date = new Date(date);
        if (goals) game.goals = goals;
        if (mvp) game.mvp = mvp;
        if (manualWinner !== undefined) {
            game.manualWinner = manualWinner === "" ? undefined : manualWinner;
        }

        await game.save();

        // If it was finalized (and still is, which is true as we didn't change isFinalized), apply new stats
        if (game.isFinalized) {
            // Add new goals
            for (const goal of game.goals) {
                await Player.findByIdAndUpdate(goal.player, {
                    $inc: { "stats.goals": goal.count }
                });
            }

            // Add new MVP
            if (game.mvp) {
                await Player.findByIdAndUpdate(game.mvp, {
                    $inc: { "stats.mvps": 1 }
                });
            }

            // Add new match results
            const teamAIds = game.teamA.map((id: any) => id.toString());
            const teamBIds = game.teamB.map((id: any) => id.toString());
            const allPlayers = [...teamAIds, ...teamBIds];

            let scoreA = 0;
            let scoreB = 0;
            let winningTeam: string[] = [];

            if (game.manualWinner) {
                if (game.manualWinner === 'teamA') winningTeam = teamAIds;
                else if (game.manualWinner === 'teamB') winningTeam = teamBIds;
            } else {
                game.goals.forEach((g: any) => {
                    if (teamAIds.includes(g.player.toString())) scoreA += g.count;
                    if (teamBIds.includes(g.player.toString())) scoreB += g.count;
                });
                winningTeam = scoreA > scoreB ? teamAIds : (scoreB > scoreA ? teamBIds : []);
            }

            for (const playerId of allPlayers) {
                const isWinner = winningTeam.includes(playerId);
                const isDraw = winningTeam.length === 0;
                const points = pointsForOutcome(rule, outcomeFor(isWinner, isDraw));

                await Player.findByIdAndUpdate(playerId, {
                    $inc: {
                        "stats.gamesPlayed": 1,
                        "stats.wins": isWinner ? 1 : 0,
                        "stats.draws": isDraw ? 1 : 0,
                        "stats.losses": (!isWinner && !isDraw) ? 1 : 0,
                        "stats.points": points
                    }
                });
            }
        }

        return NextResponse.json(game);
    } catch (error) {
        console.error("Error updating game:", error);
        return NextResponse.json({ message: "Error updating game" }, { status: 500 });
    }
}

