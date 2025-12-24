import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Player from "@/models/Player";

/**
 * Migration endpoint to recalculate points for all players
 * Call: GET /api/admin/recalculate-points
 */
export async function GET() {
    try {
        await dbConnect();

        const players = await Player.find({});
        let updatedCount = 0;

        for (const player of players) {
            const wins = player.stats?.wins || 0;
            const draws = player.stats?.draws || 0;
            const calculatedPoints = (wins * 3) + (draws * 1);

            await Player.findByIdAndUpdate(player._id, {
                $set: { 'stats.points': calculatedPoints }
            });

            updatedCount++;
        }

        return NextResponse.json({
            message: "Points recalculated successfully",
            playersUpdated: updatedCount
        });
    } catch (error) {
        console.error("Error recalculating points:", error);
        return NextResponse.json({
            message: "Error recalculating points",
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
