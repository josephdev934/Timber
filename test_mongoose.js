require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const mongoose = require('mongoose');

async function test() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://akujiezeJoseph:QtPDm_n6SPMtZd2@cluster0.ayvoh7i.mongodb.net/ai-code-reviewer?appName=Cluster0';
    await mongoose.connect(uri);

    const MessageSchema = new mongoose.Schema({
      chatId: { type: String, required: true, index: true },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      text: { type: String, required: true },
      mediaUrl: { type: String },
    });
    
    const Message = mongoose.models.TestMessage || mongoose.model('TestMessage', MessageSchema);
    
    const msg = new Message({
      chatId: "test_chat",
      senderId: new mongoose.Types.ObjectId(),
      text: "",
      mediaUrl: "http://example.com/image.jpg"
    });

    await msg.validate();
    console.log("Validation passed!");
  } catch (err) {
    console.error("Validation failed:", err.message);
  } finally {
    process.exit(0);
  }
}
test();
