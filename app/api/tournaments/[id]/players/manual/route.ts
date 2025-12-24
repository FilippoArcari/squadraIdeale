import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Player from "@/models/Player";
import Turnament from "@/models/Turnament";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const { name, position, rating } = await req.json();

        if (!name || !position || rating === undefined) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        // Create player without userId (manual player)
        const player = await Player.create({
            name,
            position,
            rating,
            // No userId - this distinguishes manual players from registered users
        });

        // Add player to tournament participants
        await Turnament.findByIdAndUpdate(id, {
            $addToSet: { participants: player._id }
        });

        return NextResponse.json(player, { status: 201 });
    } catch (error) {
        console.error("Error creating manual player:", error);
        return NextResponse.json({
            message: "Error creating manual player",
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
