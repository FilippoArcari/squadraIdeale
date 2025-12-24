import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Turnament from "@/models/Turnament";
import Player from "@/models/Player";
import Game from "@/models/Game";
import { generateJoinCode } from "@/lib/generateJoinCode";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;

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

        return NextResponse.json(tournament);
    } catch (error) {
        console.error("Error fetching tournament details:", error);
        return NextResponse.json({
            message: "Error fetching tournament details",
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
