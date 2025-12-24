import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Tournament from "@/models/Turnament";
import Player from "@/models/Player";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        // Ensure models are registered
        Player;

        const { joinCode, playerName, position, rating } = await req.json();

        // Validate required fields
        if (!joinCode || !playerName || !position) {
            return NextResponse.json(
                { message: "Join code, player name, and position are required" },
                { status: 400 }
            );
        }

        // Find tournament by join code
        const tournament = await Tournament.findOne({
            joinCode: joinCode.toUpperCase()
        });

        if (!tournament) {
            return NextResponse.json(
                { message: "Invalid join code. Tournament not found." },
                { status: 404 }
            );
        }

        // @ts-ignore
        const userId = session.user.id;

        // Check if user already has a player in this tournament
        const existingPlayer = await Player.findOne({
            userId: userId,
            _id: { $in: tournament.participants }
        });

        if (existingPlayer) {
            return NextResponse.json(
                { message: "You already have a player in this tournament" },
                { status: 409 }
            );
        }

        // Create new Player instance for this tournament
        const player = await Player.create({
            name: playerName,
            position: position,
            rating: rating || 50,
            userId: userId,
            image: session.user.image,
        });

        // Add player to tournament participants
        tournament.participants.push(player._id);
        await tournament.save();

        // Return populated tournament
        const populatedTournament = await Tournament.findById(tournament._id)
            .populate("participants")
            .populate("owner");

        return NextResponse.json({
            message: "Successfully joined tournament",
            tournament: populatedTournament,
        });
    } catch (error) {
        console.error("Error joining tournament:", error);
        return NextResponse.json(
            {
                message: "Error joining tournament",
                error: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
