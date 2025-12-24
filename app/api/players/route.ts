import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Player from "@/models/Player";
import Turnament from "@/models/Turnament";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        // @ts-ignore
        const userId = session.user.id;

        const players = await Player.find({ userId });

        return NextResponse.json(players);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching players" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { name, position, rating, tournamentId } = await req.json();

        if (!name || !position || !tournamentId) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        await dbConnect();

        const player = await Player.create({
            name,
            position,
            rating: rating || 50,
        });

        await Turnament.findByIdAndUpdate(tournamentId, {
            $push: { participants: player._id },
        });

        return NextResponse.json(player, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "Error creating player" }, { status: 500 });
    }
}
