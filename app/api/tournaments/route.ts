import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Turnament from "@/models/Turnament";
import Player from "@/models/Player";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateJoinCode } from "@/lib/generateJoinCode";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        // @ts-ignore
        const userId = session.user.id;

        // Find all player profiles for this user
        const userPlayers = await Player.find({ userId });
        const playerIds = userPlayers.map(p => p._id);

        const tournaments = await Turnament.find({
            $or: [
                { owner: userId },
                { participants: { $in: playerIds } }
            ]
        }).sort({ createdAt: -1 });

        return NextResponse.json(tournaments);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching tournaments" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { name, sport, season, description } = await req.json();

        if (!name || !sport || !season) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        await dbConnect();
        // @ts-ignore
        const userId = session.user.id;

        // Ensure Player model is loaded
        Player;

        // Generate a unique join code
        let joinCode = generateJoinCode();
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;

        // Retry if code already exists
        while (!isUnique && attempts < maxAttempts) {
            const existing = await Turnament.findOne({ joinCode });
            if (!existing) {
                isUnique = true;
            } else {
                joinCode = generateJoinCode();
                attempts++;
            }
        }

        if (!isUnique) {
            return NextResponse.json(
                { message: "Failed to generate unique join code. Please try again." },
                { status: 500 }
            );
        }

        // Create a Player instance for the owner in this tournament
        // Since players are tournament-specific with different ratings/positions
        const ownerPlayer = await Player.create({
            name: session?.user?.name || "Owner",
            position: "Centrocampista", // Default position, can be changed later
            userId: userId,
            rating: 50, // Default rating
            image: session?.user?.image,
        });

        const participants = [ownerPlayer._id];

        const tournamentData = {
            name,
            sport,
            season,
            description,
            owner: userId,
            participants,
            games: [],
            joinCode,
        };

        const tournament = await Turnament.create(tournamentData);

        return NextResponse.json(tournament, { status: 201 });
    } catch (error) {
        console.error("Error creating tournament:", error);
        return NextResponse.json({ message: "Error creating tournament" }, { status: 500 });
    }
}
