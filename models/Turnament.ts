import mongoose from "mongoose";
import { InferSchemaType } from "mongoose";
import { Sport } from "./Sport";

const TurnamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please provide a name for this tournament."],
        maxlength: [40, "Tournament name cannot be more than 40 characters"],
    },
    sport: {
        type: String,
        enum: Sport,
        required: [true, "Sport is required."],
    },
    players: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
        required: [true, "Players are required."],
        ratings: {
            type: Number,
            range: [0, 100],
            required: [true, "Rating is required."],
        },
    },
    description: {
        type: String,
    },
    season: {
        type: Number,
        required: [true, "Season is required."],
    },
    games: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Game" }],
        required: [true, "Games are required."],
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Owner is required."],
    },
    admins: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
        default: [],
    },
    participants: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
        default: [],
    },
    status: {
        type: String,
        enum: ["active", "completed"],
        default: "active",
    },
    joinCode: {
        type: String,
        unique: true,
        uppercase: true,
        minlength: 6,
        maxlength: 6,
        sparse: true, // Allows null/undefined with unique constraint
    },
});

export type Turnament = InferSchemaType<typeof TurnamentSchema>;

// Force model re-registration to ensure joinCode field is recognized
if (mongoose.models.Turnament) {
    delete mongoose.models.Turnament;
}

export default mongoose.model<Turnament>("Turnament", TurnamentSchema);


