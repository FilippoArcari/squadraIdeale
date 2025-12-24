import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Turnament from "@/models/Turnament";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        const { playerId } = await req.json();

        // Verify user is tournament owner or existing admin
        const tournament = await Turnament.findById(id).populate("admins");
        if (!tournament) {
            return NextResponse.json({ message: "Tournament not found" }, { status: 404 });
        }

        const userId = (session.user as any).id;
        const isOwner = tournament.owner.toString() === userId;
        const isAdmin = tournament.admins.some((admin: any) => admin.userId?.toString() === userId);

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ message: "Only tournament owner or admins can promote admins" }, { status: 403 });
        }

        // Check if player is already admin
        if (tournament.admins.some((admin: any) => admin._id.toString() === playerId)) {
            return NextResponse.json({ message: "Player is already an admin" }, { status: 400 });
        }

        // Add player to admins
        const updated = await Turnament.findByIdAndUpdate(
            id,
            { $addToSet: { admins: playerId } },
            { new: true }
        ).populate("admins");

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error promoting admin:", error);
        return NextResponse.json({ message: "Error promoting admin" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        const { playerId } = await req.json();

        // Verify user is tournament owner or existing admin
        const tournament = await Turnament.findById(id);
        if (!tournament) {
            return NextResponse.json({ message: "Tournament not found" }, { status: 404 });
        }

        const userId = (session.user as any).id;
        const isOwner = tournament.owner.toString() === userId;

        if (!isOwner) {
            return NextResponse.json({ message: "Only tournament owner can remove admins" }, { status: 403 });
        }

        // Remove player from admins
        const updated = await Turnament.findByIdAndUpdate(
            id,
            { $pull: { admins: playerId } },
            { new: true }
        ).populate("admins");

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error removing admin:", error);
        return NextResponse.json({ message: "Error removing admin" }, { status: 500 });
    }
}
