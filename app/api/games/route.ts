import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Game from "@/models/Game";
import Turnament from "@/models/Turnament";
import mongoose from "mongoose";

export async function POST(req: Request) {
    try {
        const { tournamentId, teamA, teamB, date } = await req.json();

        if (!tournamentId || !teamA || !teamB || !date) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        // Validate that all IDs are valid MongoDB ObjectIDs
        const allPlayerIds = [...teamA, ...teamB];
        const invalidIds = allPlayerIds.filter(id => !mongoose.Types.ObjectId.isValid(id));

        if (invalidIds.length > 0) {
            console.error("Invalid player IDs:", invalidIds);
            return NextResponse.json({
                message: "Invalid player IDs detected",
                invalidIds
            }, { status: 400 });
        }

        if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
            return NextResponse.json({ message: "Invalid tournament ID" }, { status: 400 });
        }

        await dbConnect();

        // Questo endpoint (usato dal flusso di bilanciamento squadre in
        // /tournaments/[id]/play) creava sempre Game con season = default dello
        // schema (1), ignorando la stagione in corso del torneo. Va allineato
        // esplicitamente a POST /api/tournaments/[id]/games, altrimenti le
        // partite create da qui "spariscono" non appena si passa alla stagione 2+,
        // perche' restano taggate stagione 1 mentre la vista corrente filtra su
        // currentSeason.
        const tournament = await Turnament.findById(tournamentId).select("currentSeason");
        if (!tournament) {
            return NextResponse.json({ message: "Tournament not found" }, { status: 404 });
        }

        const game = await Game.create({
            turnament: tournamentId,
            teamA,
            teamB,
            date,
            players: [...teamA, ...teamB],
            isVotingOpen: false,
            season: tournament.currentSeason || 1,
        });

        await Turnament.findByIdAndUpdate(tournamentId, {
            $push: { games: game._id },
        });

        return NextResponse.json(game, { status: 201 });
    } catch (error) {
        console.error("Error creating game:", error);
        return NextResponse.json({ message: "Error creating game", error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
