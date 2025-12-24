import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Turnament from "@/models/Turnament";
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

        const tournament = await Turnament.findById(id);

        if (!tournament) {
            return NextResponse.json({ message: "Tournament not found" }, { status: 404 });
        }

        // Verify that user is the owner
        if (tournament.owner.toString() !== (session.user as any).id) {
            return NextResponse.json({ message: "Only the owner can deactivate the tournament" }, { status: 403 });
        }

        // Update status to completed
        tournament.status = "completed";
        await tournament.save();

        return NextResponse.json({ message: "Tournament deactivated successfully", tournament });
    } catch (error) {
        console.error("Error deactivating tournament:", error);
        return NextResponse.json({
            message: "Error deactivating tournament",
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
