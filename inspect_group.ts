import mongoose from 'mongoose';
import { ConversationModel } from './src/infrastructure/db/models/Conversation';
import dotenv from 'dotenv';

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || '');
  const group = await ConversationModel.findOne({ type: 'group' }).populate('createdBy', 'name').lean();
  console.log('GROUP:', JSON.stringify(group, null, 2));
  process.exit(0);
}

check();
