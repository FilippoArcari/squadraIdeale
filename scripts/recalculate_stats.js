require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
    name: String,
    stats: {
        goals: { type: Number, default: 0 },
        mvps: { type: Number, default: 0 },
        gamesPlayed: { type: Number, default: 0 },
        wins: { type: Number, default: 0 },
        draws: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
        points: { type: Number, default: 0 },
    }
});

const GameSchema = new mongoose.Schema({
    date: Date,
    teamA: [mongoose.Schema.Types.ObjectId],
    teamB: [mongoose.Schema.Types.ObjectId],
    goals: [{ player: mongoose.Schema.Types.ObjectId, count: Number }],
    mvp: mongoose.Schema.Types.ObjectId,
    manualWinner: String,
    isFinalized: Boolean
});

async function run() {
    if (!process.env.MONGODB_URI) {
        console.error("❌ MONGODB_URI is not defined in .env");
        process.exit(1);
    }

    try {
        console.log("Connettendo a MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connesso a MongoDB");

        const Player = mongoose.models.Player || mongoose.model("Player", PlayerSchema);
        const Game = mongoose.models.Game || mongoose.model("Game", GameSchema);

        // 1. Azzerare tutte le statistiche
        console.log("🔄 Azzerando le statistiche di tutti i giocatori...");
        await Player.updateMany({}, {
            $set: {
                "stats.goals": 0, "stats.mvps": 0, "stats.gamesPlayed": 0,
                "stats.wins": 0, "stats.draws": 0, "stats.losses": 0, "stats.points": 0
            }
        });

        // 2. Prelevare le partite finalizzate
        const games = await Game.find({ isFinalized: true });
        console.log(`📊 Trovate ${games.length} partite finalizzate da elaborare...`);

        // 3. Ricalcolare per ogni partita
        const goalHistory = {};
        for (const game of games) {
            // Gol
            for (const goal of game.goals) {
                const playerId = goal.player.toString();
                await Player.findByIdAndUpdate(playerId, { $inc: { "stats.goals": goal.count } });
                
                if (!goalHistory[playerId]) goalHistory[playerId] = [];
                goalHistory[playerId].push({ date: game.date, count: goal.count });
            }

            // MVP
            if (game.mvp) {
                await Player.findByIdAndUpdate(game.mvp, { $inc: { "stats.mvps": 1 } });
            }

            // Risultati partita (Vittorie, Sconfitte, Punti)
            const teamAIds = game.teamA.map(id => id.toString());
            const teamBIds = game.teamB.map(id => id.toString());
            const allPlayers = [...teamAIds, ...teamBIds];

            let scoreA = 0;
            let scoreB = 0;
            let winningTeam = [];

            if (game.manualWinner) {
                if (game.manualWinner === "teamA") winningTeam = teamAIds;
                else if (game.manualWinner === "teamB") winningTeam = teamBIds;
            } else {
                game.goals.forEach(g => {
                    if (teamAIds.includes(g.player.toString())) scoreA += g.count;
                    if (teamBIds.includes(g.player.toString())) scoreB += g.count;
                });
                winningTeam = scoreA > scoreB ? teamAIds : (scoreB > scoreA ? teamBIds : []);
            }

            for (const playerId of allPlayers) {
                const isWinner = winningTeam.includes(playerId);
                const isDraw = winningTeam.length === 0;
                const points = isWinner ? 3 : (isDraw ? 1 : 0);

                await Player.findByIdAndUpdate(playerId, {
                    $inc: {
                        "stats.gamesPlayed": 1,
                        "stats.wins": isWinner ? 1 : 0,
                        "stats.draws": isDraw ? 1 : 0,
                        "stats.losses": (!isWinner && !isDraw) ? 1 : 0,
                        "stats.points": points
                    }
                });
            }
        }
        //Stampo le statistiche di tutti i giocatori e quando hanno segnato gol
        const players = await Player.find();
        players.forEach(player => {
            console.log(`\n⚽ Giocatore: ${player.name}`);
            console.log(`   Statistiche:`, player.stats);
            
            const playerGoals = goalHistory[player._id.toString()] || [];
            if (playerGoals.length > 0) {
                console.log(`   Cronologia Gol:`);
                playerGoals.sort((a, b) => new Date(a.date) - new Date(b.date))
                    .forEach(g => {
                        console.log(`     - ${new Date(g.date).toLocaleDateString()}: ${g.count} gol`);
                    });
            } else {
                console.log(`   Cronologia Gol: Nessun gol segnato.`);
            }
        });

        console.log("✅ Ricalcolo completato con successo!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Errore durante il ricalcolo:", error);
        process.exit(1);
    }
}

run();
