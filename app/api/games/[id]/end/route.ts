import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Game from "@/models/Game";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { goals, manualWinner: requestManualWinner } = await req.json();

        await dbConnect();
        const { id } = await params;

        // Fetch the game to get team information
        const game = await Game.findById(id);
        if (!game) {
            return NextResponse.json({ message: "Game not found" }, { status: 404 });
        }

        // Transform goals object { playerId: count } to array
        const goalsArray = Object.entries(goals).map(([player, count]) => ({
            player,
            count: Number(count)
        }));

        // Calculate team scores
        const teamAIds = game.teamA.map((id: any) => id.toString());
        const teamBIds = game.teamB.map((id: any) => id.toString());

        let scoreA = 0;
        let scoreB = 0;

        goalsArray.forEach((g) => {
            if (teamAIds.includes(g.player)) {
                scoreA += g.count;
            } else if (teamBIds.includes(g.player)) {
                scoreB += g.count;
            }
        });

        // Determine winner based on team totals
        let computedWinner: "teamA" | "teamB" | "draw";
        if (scoreA > scoreB) {
            computedWinner = "teamA";
        } else if (scoreB > scoreA) {
            computedWinner = "teamB";
        } else {
            computedWinner = "draw";
        }

        await Game.findByIdAndUpdate(id, {
            goals: goalsArray,
            isVotingOpen: true,
            manualWinner: computedWinner // Store the team-based winner
        }, { new: true });

        return NextResponse.json({ message: "Match ended, voting open", winner: computedWinner });
    } catch (error) {
        console.error("Error ending match:", error);
        return NextResponse.json({ message: "Error ending match" }, { status: 500 });
    }
}
