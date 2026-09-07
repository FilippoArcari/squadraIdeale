require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

/**
 * Migrazione one-shot da eseguire UNA SOLA VOLTA prima di mettere in produzione
 * la feature "stagioni multiple per torneo".
 *
 * Perche' serve: models/Game.ts e models/Turnament.ts ora hanno rispettivamente
 * un campo `season` e `currentSeason`. Mongoose applica i default solo quando un
 * documento viene creato/salvato tramite Mongoose stesso: i documenti gia'
 * presenti nel database NON hanno questi campi finche' non li scriviamo
 * esplicitamente. Senza questo backfill, l'aggregazione per stagione
 * (`Game.find({ turnament, season: 1 })` in lib/seasonStats.ts) non troverebbe
 * NESSUNA delle partite storiche, perche' un `$match` su `season: 1` non
 * combacia con documenti in cui il campo `season` e' del tutto assente.
 *
 * Esegui con: node scripts/backfill-season.js
 */
async function run() {
    if (!process.env.MONGODB_URI) {
        console.error("❌ MONGODB_URI is not defined in .env");
        process.exit(1);
    }

    try {
        console.log("Connettendo a MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connesso a MongoDB");

        const db = mongoose.connection.db;

        const gamesResult = await db.collection('games').updateMany(
            { season: { $exists: false } },
            { $set: { season: 1 } }
        );
        console.log(`⚽ Partite aggiornate con season=1: ${gamesResult.modifiedCount}`);

        const tournamentsResult = await db.collection('turnaments').updateMany(
            { currentSeason: { $exists: false } },
            { $set: { currentSeason: 1 } }
        );
        console.log(`🏆 Tornei aggiornati con currentSeason=1: ${tournamentsResult.modifiedCount}`);

        // Regola punti storica (3 vittoria / 1 pareggio / 0 sconfitta / 0 assente),
        // valida dalla stagione 1 in poi, per i tornei che non hanno ancora uno
        // storico regole (creati prima di questa feature). Sicuro da rieseguire:
        // tocca solo i documenti privi del campo.
        const pointsRulesResult = await db.collection('turnaments').updateMany(
            { pointsRuleHistory: { $exists: false } },
            { $set: { pointsRuleHistory: [{ fromSeason: 1, winner: 3, loser: 0, draw: 1, absent: 0 }] } }
        );
        console.log(`📊 Tornei aggiornati con la regola punti storica (3/1/0): ${pointsRulesResult.modifiedCount}`);

        console.log("✅ Backfill completato con successo!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Errore durante il backfill:", error);
        process.exit(1);
    }
}

run();
