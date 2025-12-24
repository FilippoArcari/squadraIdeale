import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Game from "@/models/Game";
import Turnament from "@/models/Turnament";
import mongoose from "mongoose";

export async function POST(req: Request) {
    try {
        const { tournamentId, teamA, teamB, date } = await req.json();

        if (!tournamentId || !teamA || !teamB || !date) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        // Validate that all IDs are valid MongoDB ObjectIDs
        const allPlayerIds = [...teamA, ...teamB];
        const invalidIds = allPlayerIds.filter(id => !mongoose.Types.ObjectId.isValid(id));

        if (invalidIds.length > 0) {
            console.error("Invalid player IDs:", invalidIds);
            return NextResponse.json({
                message: "Invalid player IDs detected",
                invalidIds
            }, { status: 400 });
        }

        if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
            return NextResponse.json({ message: "Invalid tournament ID" }, { status: 400 });
        }

        await dbConnect();

        const game = await Game.create({
            turnament: tournamentId,
            teamA,
            teamB,
            date,
            players: [...teamA, ...teamB],
            isVotingOpen: false,
        });

        await Turnament.findByIdAndUpdate(tournamentId, {
            $push: { games: game._id },
        });

        return NextResponse.json(game, { status: 201 });
    } catch (error) {
        console.error("Error creating game:", error);
        return NextResponse.json({ message: "Error creating game", error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
