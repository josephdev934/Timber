const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/timber");
  const Conversation = mongoose.connection.collection('conversations');
  const chats = await Conversation.find({ type: 'group' }).toArray();
  console.log(JSON.stringify(chats, null, 2));
  process.exit(0);
}

run().catch(console.error);
