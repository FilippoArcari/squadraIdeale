import "dotenv/config";
import dbConnect from "../lib/dbConnect";
import Player from "../models/Player";

async function verify() {
    console.log("Connecting to database...");
    try {
        await dbConnect();
        console.log("Connected successfully!");

        console.log("Creating a test player instance...");
        const player = new Player({
            name: "Test Player",
            position: "Forward",
            rating: 85,
            team: "Test Team",
        });
        console.log("Player instance created:", player);

        // We won't save it to avoid polluting the DB, just checking instantiation works
        // and validation runs (if we were to save)
        await player.validate();
        console.log("Player validation successful!");

        console.log("Verification complete.");
        process.exit(0);
    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
}

verify();
