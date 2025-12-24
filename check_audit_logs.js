const mongoose = require('mongoose');
require('dotenv').config();

async function checkAuditLogs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        const AuditLog = mongoose.model('AuditLog', new mongoose.Schema({
            userId: mongoose.Schema.Types.ObjectId,
            path: String,
            method: String,
            userAgent: String,
            ipAddress: String,
            timestamp: Date
        }));
        
        const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(10);
        console.log('\n=== Recent Audit Logs (Latest 10) ===');
        console.log(JSON.stringify(logs, null, 2));
        console.log(`\nTotal logs found: ${await AuditLog.countDocuments()}`);
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAuditLogs();
