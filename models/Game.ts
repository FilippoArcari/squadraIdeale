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
    // Numero di stagione del torneo a cui appartiene questa partita (copiato da
    // Turnament.currentSeason al momento della creazione). E' il campo che rende
    // possibile calcolare classifiche "solo stagione corrente" oppure storiche,
    // senza dover mai toccare Player.stats: le statistiche per stagione si ottengono
    // sempre aggregando le Game con questo season, mai da un contatore mutato a mano
    // (vedi lib/seasonStats.ts per il motivo di questa scelta).
    season: {
        type: Number,
        required: [true, "Season is required."],
        default: 1,
        min: 1,
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
