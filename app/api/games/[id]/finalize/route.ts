import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Game from "@/models/Game";
import Player from "@/models/Player";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const game = await Game.findById(id);
        if (!game) return NextResponse.json({ message: "Game not found" }, { status: 404 });

        // Calculate MVP
        const voteCounts: { [key: string]: number } = {};
        game.votes.forEach((v: any) => {
            const votedFor = v.votedFor.toString();
            voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
        });

        let mvpId = null;
        let maxVotes = -1;
        for (const [playerId, count] of Object.entries(voteCounts)) {
            if (count > maxVotes) {
                maxVotes = count;
                mvpId = playerId;
            }
        }

        // Update Game
        game.mvp = mvpId;
        game.isVotingOpen = false; // Close voting
        game.isFinalized = true;
        await game.save();

        // Update Player Stats
        // 1. Goals
        for (const goal of game.goals) {
            await Player.findByIdAndUpdate(goal.player, {
                $inc: { "stats.goals": goal.count }
            });
        }

        // 2. MVP
        if (mvpId) {
            await Player.findByIdAndUpdate(mvpId, {
                $inc: { "stats.mvps": 1 }
            });
        }

        // 3. Games Played & Wins
        // Determine winner
        let scoreA = 0;
        let scoreB = 0;
        game.goals.forEach((g: any) => {
            // Check if player is in Team A or Team B
            // This is inefficient, better to check team arrays.
            // For now, let's assume we can find them.
        });

        // Efficient way: Fetch all players and check team
        // Or just iterate teamA and teamB IDs from game object if populated?
        // Game object here might not be populated if we just did findById without populate.
        // Let's rely on the fact that we know who is in which team from the game document.

        const teamAIds = game.teamA.map((id: any) => id.toString());
        const teamBIds = game.teamB.map((id: any) => id.toString());

        let winningTeam: string[] = [];

        if (game.manualWinner) {
            if (game.manualWinner === 'teamA') winningTeam = teamAIds;
            else if (game.manualWinner === 'teamB') winningTeam = teamBIds;
            // if draw, winningTeam remains empty
        } else {
            // Fallback to goals
            game.goals.forEach((g: any) => {
                if (teamAIds.includes(g.player.toString())) scoreA += g.count;
                if (teamBIds.includes(g.player.toString())) scoreB += g.count;
            });
            winningTeam = scoreA > scoreB ? teamAIds : (scoreB > scoreA ? teamBIds : []);
        }

        const allPlayers = [...teamAIds, ...teamBIds];
        for (const playerId of allPlayers) {
            const isWinner = winningTeam.includes(playerId);
            const isDraw = winningTeam.length === 0; // Empty array means draw
            const isLoser = !isWinner && !isDraw;

            // Calculate points: +3 for win, +1 for draw, 0 for loss
            const points = isWinner ? 3 : (isDraw ? 1 : 0);

            await Player.findByIdAndUpdate(playerId, {
                $inc: {
                    "stats.gamesPlayed": 1,
                    "stats.wins": isWinner ? 1 : 0,
                    "stats.draws": isDraw ? 1 : 0,
                    "stats.losses": isLoser ? 1 : 0,
                    "stats.points": points
                }
            });
        }

        return NextResponse.json({ message: "Game finalized successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error finalizing game" }, { status: 500 });
    }
}
