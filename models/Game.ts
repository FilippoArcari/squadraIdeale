import mongoose from "mongoose";
import { InferSchemaType } from "mongoose";

const GameSchema = new mongoose.Schema({
    players: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
        required: [true, "Players are required."],
    },
    turnament: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Turnament",
        required: [true, "Turnament is required."],
    },
    scorer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player",
    },
    mvp: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player",
    },
    date: {
        type: Date,
        required: [true, "Date is required."],
    },
    teamA: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
        default: [],
    },
    teamB: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
        default: [],
    },
    goals: {
        type: [{
            player: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
            count: { type: Number, default: 0 },
        }],
        default: [],
    },
    votes: {
        type: [{
            voter: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
            votedFor: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
        }],
        default: [],
    },
    isVotingOpen: {
        type: Boolean,
        default: false,
    },
    manualWinner: {
        type: String,
        enum: ["teamA", "teamB", "draw"],
        required: false,
    },
    isFinalized: {
        type: Boolean,
        default: false,
    },
});

export type Game = InferSchemaType<typeof GameSchema>;

export default mongoose.models.Game || mongoose.model<Game>("Game", GameSchema);
