import mongoose from 'mongoose';
import { PostModel } from './src/infrastructure/db/models/Post';
import { MediaModel } from './src/infrastructure/db/models/Media';
import dotenv from 'dotenv';

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI!);
  
  const mediaCount = await MediaModel.countDocuments();
  const postsWithImages = await PostModel.countDocuments({ images: { $not: { $size: 0 } } });
  const totalPosts = await PostModel.countDocuments();

  console.log(`Media Documents: ${mediaCount}`);
  console.log(`Total Posts: ${totalPosts}`);
  console.log(`Posts with Images: ${postsWithImages}`);

  if (postsWithImages > 0) {
    const sample = await PostModel.findOne({ images: { $not: { $size: 0 } } }).populate('author', 'name').lean();
    console.log("Sample Post with Image:", JSON.stringify(sample, null, 2));
  }

  process.exit(0);
}

check();
