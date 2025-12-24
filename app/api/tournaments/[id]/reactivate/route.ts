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
            return NextResponse.json({ message: "Only the owner can reactivate the tournament" }, { status: 403 });
        }

        // Update status to active
        tournament.status = "active";
        await tournament.save();

        return NextResponse.json({ message: "Tournament reactivated successfully", tournament });
    } catch (error) {
        console.error("Error reactivating tournament:", error);
        return NextResponse.json({
            message: "Error reactivating tournament",
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
