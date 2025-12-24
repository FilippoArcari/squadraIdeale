// One-time migration script to sync user profile images to player records
// Run this with: npx tsx scripts/sync-player-images.ts

import { config } from 'dotenv';
config({ path: '.env' });

import dbConnect from '../lib/dbConnect';
import Player from '../models/Player';
import User from '../models/User';

async function syncPlayerImages() {
    console.log('🔄 Starting player image sync...\n');

    await dbConnect();

    const players = await Player.find({});
    console.log(`📊 Found ${players.length} players\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const player of players) {
        try {
            // Skip if player already has an image
            if (player.image) {
                console.log(`⏭️  Skipping ${player.name} (already has image)`);
                skipped++;
                continue;
            }

            // Find the user associated with this player
            const user = await User.findById(player.userId);

            if (!user) {
                console.log(`⚠️  No user found for ${player.name}`);
                skipped++;
                continue;
            }

            if (!user.image) {
                console.log(`⏭️  Skipping ${player.name} (user has no image)`);
                skipped++;
                continue;
            }

            // Update player with user's image
            player.image = user.image;
            await player.save();
            console.log(`✅ Updated ${player.name} with image from ${user.name}`);
            updated++;
        } catch (err) {
            console.error(`❌ Error updating player ${player.name}:`, err);
            errors++;
        }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   Total players: ${players.length}`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);

    process.exit(0);
}

syncPlayerImages().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
});
