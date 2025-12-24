                                                                                                                                        import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Game from "@/models/Game";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const game = await Game.findById(id)
            .populate("teamA", "name image")
            .populate("teamB", "name image")
            .populate("mvp", "name image")
            .populate({
                path: "turnament",
                select: "owner"
            });

        if (!game) {
            return NextResponse.json({ message: "Game not found" }, { status: 404 });
        }

        return NextResponse.json(game);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching game" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);

        const { date, goals, mvp, manualWinner } = await req.json();
        await dbConnect();
        const { id } = await params;

        const game = await Game.findById(id).populate("turnament");
        if (!game) {
            return NextResponse.json({ message: "Game not found" }, { status: 404 });
        }

        // Verify ownership
        if (!session || ((session.user as any).id !== game.turnament.owner.toString())) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        // Update fields
        if (date) game.date = new Date(date);
        if (goals) game.goals = goals;
        if (mvp) game.mvp = mvp;
        if (manualWinner !== undefined) {
            // If manualWinner is an empty string, set to undefined to unset the field
            game.manualWinner = manualWinner === "" ? undefined : manualWinner;
        }

        await game.save();

        return NextResponse.json(game);
    } catch (error) {
        console.error("Error updating game:", error);
        return NextResponse.json({ message: "Error updating game" }, { status: 500 });
    }
}

