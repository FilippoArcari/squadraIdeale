import mongoose from "mongoose";
import { InferSchemaType } from "mongoose";
import { positions } from "./enums";


/* PlayerSchema will correspond to a collection in your MongoDB database. */
const PlayerSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, "Please provide a name for this player."],
        maxlength: [60, "Name cannot be more than 60 characters"],
    },
    position: {
        type: String,
        required: [true, "Please provide the player's position"],
        maxlength: [30, "Position cannot be more than 30 characters"],
        enum: positions,
    },
    image: {
        type: String,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    rating: {
        type: Number,
        min: 0,
        max: 100,
        default: 50,
    },
    stats: {
        goals: { type: Number, default: 0 },
        mvps: { type: Number, default: 0 },
        gamesPlayed: { type: Number, default: 0 },
        wins: { type: Number, default: 0 },
        draws: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
        points: { type: Number, default: 0 },
    },
});

export type Player = InferSchemaType<typeof PlayerSchema>;


export default mongoose.models.Player || mongoose.model<Player>("Player", PlayerSchema);
