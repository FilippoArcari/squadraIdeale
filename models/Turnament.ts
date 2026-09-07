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
    // Numero di stagione attualmente in corso per questo torneo (1, 2, 3, ...).
    // A differenza di "season" (etichetta libera scelta alla creazione, es. l'anno),
    // "currentSeason" e' il contatore progressivo interno che identifica quali Game
    // appartengono al periodo di gioco corrente. Le Game create quando currentSeason = N
    // vengono taggate con season = N (vedi models/Game.ts) e restano quel numero per sempre,
    // anche dopo che il torneo passa a una stagione successiva: questo e' cio' che permette
    // di ricostruire lo storico senza dover copiare o azzerare nulla.
    currentSeason: {
        type: Number,
        default: 1,
        min: 1,
    },
    // Cronologia delle regole di assegnazione punti. Ogni voce dice "a partire
    // dalla stagione fromSeason (inclusa), i punti sono questi" fino alla voce
    // successiva (o per sempre, se e' l'ultima). Questo e' cio' che permette di
    // cambiare formula "da ora in poi" senza riscrivere le classifiche delle
    // stagioni gia' chiuse: quelle restano ancorate alla regola con fromSeason
    // piu' basso o uguale al loro numero di stagione (vedi lib/pointsRules.ts).
    // Il default rappresenta la regola storica 3/1/0 usata prima che questa
    // funzionalita' esistesse.
    pointsRuleHistory: {
        type: [{
            fromSeason: { type: Number, required: true, min: 1 },
            winner: { type: Number, required: true },
            loser: { type: Number, required: true },
            draw: { type: Number, required: true },
            absent: { type: Number, required: true, default: 0 },
        }],
        default: [{ fromSeason: 1, winner: 3, loser: 0, draw: 1, absent: 0 }],
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


