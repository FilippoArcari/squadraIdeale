import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Tournament from "@/models/Turnament";
import Player from "@/models/Player";
import Game from "@/models/Game";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        // Ensure models are registered
        Player;
        Game;

        // Validate required fields
        if (!body.players || !Array.isArray(body.players) || body.players.length === 0) {
            return NextResponse.json(
                { message: "At least one player is required" },
                { status: 400 }
            );
        }

        if (!body.date) {
            return NextResponse.json(
                { message: "Date is required" },
                { status: 400 }
            );
        }

        // Check if tournament exists
        const tournament = await Tournament.findById(id);
        if (!tournament) {
            return NextResponse.json(
                { message: "Tournament not found" },
                { status: 404 }
            );
        }

        // Create the game
        const game = await Game.create({
            players: body.players,
            turnament: id,
            date: new Date(body.date),
            teamA: body.teamA || [],
            teamB: body.teamB || [],
        });

        // Add game to tournament's games array
        tournament.games.push(game._id);
        await tournament.save();

        // Populate the game before returning
        const populatedGame = await Game.findById(game._id)
            .populate("players")
            .populate("turnament");

        return NextResponse.json(populatedGame, { status: 201 });
    } catch (error) {
        console.error("Error creating game:", error);
        return NextResponse.json(
            {
                message: "Error creating game",
                error: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
