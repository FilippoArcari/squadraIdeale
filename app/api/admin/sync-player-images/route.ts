import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Player from "@/models/Player";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Only allow authenticated users (you could add admin check here)
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        // Get all players
        const players = await Player.find({});

        let updated = 0;
        let skipped = 0;
        let errors = 0;

        for (const player of players) {
            try {
                // Skip if player already has an image
                if (player.image) {
                    skipped++;
                    continue;
                }

                // Find the user associated with this player
                const user = await User.findById(player.userId);

                if (!user || !user.image) {
                    skipped++;
                    continue;
                }

                // Update player with user's image
                player.image = user.image;
                await player.save();
                updated++;
            } catch (err) {
                console.error(`Error updating player ${player._id}:`, err);
                errors++;
            }
        }

        return NextResponse.json({
            success: true,
            message: "Player images synced successfully",
            stats: {
                total: players.length,
                updated,
                skipped,
                errors
            }
        });
    } catch (error) {
        console.error("Error syncing player images:", error);
        return NextResponse.json(
            { error: "Failed to sync player images" },
            { status: 500 }
        );
    }
}
