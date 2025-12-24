// Simple script to check if players have images in the database
import { config } from 'dotenv';
config({ path: '.env' }); // Load .env file

import dbConnect from './lib/dbConnect';
import Player from './models/Player';

async function checkPlayerImages() {
    await dbConnect();

    const players = await Player.find().limit(5);
    console.log('\n=== Player Image Check ===\n');

    players.forEach((player, index) => {
        console.log(`Player ${index + 1}:`);
        console.log(`  Name: ${player.name}`);
        console.log(`  Image: ${player.image || '(no image)'}`);
        console.log('');
    });

    process.exit(0);
}

checkPlayerImages().catch(console.error);
