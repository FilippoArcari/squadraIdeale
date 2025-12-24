import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Turnament from "@/models/Turnament";
import Player from "@/models/Player";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string; playerId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { id, playerId } = await params;

        // Verify ownership
        const tournament = await Turnament.findById(id);
        if (!tournament) {
            return NextResponse.json({ message: "Tournament not found" }, { status: 404 });
        }

        // @ts-ignore
        if (tournament.owner.toString() !== session.user.id) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        // Remove player from tournament participants
        await Turnament.findByIdAndUpdate(id, {
            $pull: { participants: playerId }
        });

        // Delete the player document (since players are tournament-specific)
        await Player.findByIdAndDelete(playerId);

        return NextResponse.json({ message: "Player removed" });
    } catch (error) {
        console.error("Error removing player:", error);
        return NextResponse.json({ message: "Error removing player" }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string; playerId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { rating } = await req.json();

        await dbConnect();
        const { id, playerId } = await params;

        // Verify ownership
        const tournament = await Turnament.findById(id);
        if (!tournament) {
            return NextResponse.json({ message: "Tournament not found" }, { status: 404 });
        }

        // @ts-ignore
        if (tournament.owner.toString() !== session.user.id) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        // Update player
        const updatedPlayer = await Player.findByIdAndUpdate(
            playerId,
            { rating },
            { new: true }
        );

        return NextResponse.json(updatedPlayer);
    } catch (error) {
        console.error("Error updating player:", error);
        return NextResponse.json({ message: "Error updating player" }, { status: 500 });
    }
}
