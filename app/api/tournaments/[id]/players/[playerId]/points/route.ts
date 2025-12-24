import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Turnament from "@/models/Turnament";
import Player from "@/models/Player";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; playerId: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { id, playerId } = await params;
        const { points } = await req.json();

        // Verify user is tournament owner or admin
        const tournament = await Turnament.findById(id).populate("admins");
        if (!tournament) {
            return NextResponse.json({ message: "Tournament not found" }, { status: 404 });
        }

        const userId = (session.user as any).id;
        const isOwner = tournament.owner.toString() === userId;
        const isAdmin = tournament.admins.some((admin: any) => admin.userId?.toString() === userId);

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ message: "Only tournament owner or admins can manage points" }, { status: 403 });
        }

        // Update player points
        const player = await Player.findByIdAndUpdate(
            playerId,
            { $set: { "stats.points": points } },
            { new: true }
        );

        if (!player) {
            return NextResponse.json({ message: "Player not found" }, { status: 404 });
        }

        return NextResponse.json(player);
    } catch (error) {
        console.error("Error updating player points:", error);
        return NextResponse.json({ message: "Error updating points" }, { status: 500 });
    }
}
