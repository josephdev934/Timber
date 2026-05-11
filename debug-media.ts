import mongoose from 'mongoose';
import { MediaModel } from './src/infrastructure/db/models/Media';
import dotenv from 'dotenv';

dotenv.config();

async function debugMedia() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not found");
    return;
  }

  await mongoose.connect(uri);
  console.log("Connected to DB");

  const count = await MediaModel.countDocuments();
  console.log(`Total Media documents: ${count}`);

  const sample = await MediaModel.find().limit(5).lean();
  console.log("Sample Media documents:", JSON.stringify(sample, null, 2));

  await mongoose.disconnect();
}

debugMedia();
