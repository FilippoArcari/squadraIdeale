/**
 * Migration script to recalculate points for all players
 * Run with: npx ts-node scripts/recalculate-points.ts
 * 
 * Formula: points = (wins * 3) + (draws * 1)
 */

import dbConnect from '../lib/dbConnect';
import Player from '../models/Player';

async function recalculatePoints() {
    await dbConnect();

    console.log('Starting points recalculation...');

    const players = await Player.find({});
    console.log(`Found ${players.length} players`);

    for (const player of players) {
        const wins = player.stats?.wins || 0;
        const draws = player.stats?.draws || 0;
        const calculatedPoints = (wins * 3) + (draws * 1);

        await Player.findByIdAndUpdate(player._id, {
            $set: { 'stats.points': calculatedPoints }
        });

        console.log(`Updated ${player.name}: ${wins}W + ${draws}D = ${calculatedPoints} points`);
    }

    console.log('Points recalculation complete!');
    process.exit(0);
}

recalculatePoints().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
