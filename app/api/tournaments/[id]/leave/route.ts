import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Turnament from "@/models/Turnament";
import Player from "@/models/Player";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;

        const tournament = await Turnament.findById(id).populate("participants");

        if (!tournament) {
            return NextResponse.json({ message: "Tournament not found" }, { status: 404 });
        }

        // Find the player associated with the current user
        const userPlayer = tournament.participants.find(
            (p: any) => p.userId?.toString() === (session.user as any).id
        );

        if (!userPlayer) {
            return NextResponse.json({ message: "You are not a participant in this tournament" }, { status: 404 });
        }

        // Remove player from participants array
        tournament.participants = tournament.participants.filter(
            (p: any) => p._id.toString() !== userPlayer._id.toString()
        );

        await tournament.save();

        return NextResponse.json({
            message: "Successfully left the tournament",
            tournament
        });
    } catch (error) {
        console.error("Error leaving tournament:", error);
        return NextResponse.json({
            message: "Error leaving tournament",
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
