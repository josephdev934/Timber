import mongoose from 'mongoose';
import { connectToDatabase } from '../src/infrastructure/db/connect';
import { UserModel } from '../src/infrastructure/db/models/User';
import { ReportModel } from '../src/infrastructure/db/models/Report';
import { MediaModel } from '../src/infrastructure/db/models/Media';
import { NotificationLogModel } from '../src/infrastructure/db/models/NotificationLog';

async function verify() {
  try {
    console.log("Connecting to database...");
    await connectToDatabase();
    console.log("Connected.");

    // 1. Test Stats logic
    const totalUsers = await UserModel.countDocuments();
    const pendingReports = await ReportModel.countDocuments({ status: 'pending' });
    const mediaCount = await MediaModel.countDocuments();
    
    console.log("Stats Verification:");
    console.log(`- Total Users: ${totalUsers}`);
    console.log(`- Pending Reports: ${pendingReports}`);
    console.log(`- Total Media: ${mediaCount}`);

    // 2. Test Notification logic
    const unreadCount = await NotificationLogModel.countDocuments({ readAt: { $exists: false } });
    const recent = await NotificationLogModel.find().limit(5).lean();
    
    console.log("Notification Verification:");
    console.log(`- Unread Count: ${unreadCount}`);
    console.log(`- Recent Count: ${recent.length}`);

    process.exit(0);
  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  }
}

verify();
