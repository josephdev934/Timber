const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://akujiezeJoseph:QtPDm_n6SPMtZd2@cluster0.ayvoh7i.mongodb.net/ai-code-reviewer?appName=Cluster0";

async function check() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const PostSchema = new mongoose.Schema({}, { strict: false });
        const Post = mongoose.model('Post', PostSchema, 'posts');

        const postWithImages = await Post.findOne({ images: { $exists: true, $ne: [] } });
        console.log("Post with images:", JSON.stringify(postWithImages, null, 2));

        const postWithVideo = await Post.findOne({ video: { $exists: true, $ne: null } });
        console.log("Post with video:", JSON.stringify(postWithVideo, null, 2));

        const MessageSchema = new mongoose.Schema({}, { strict: false });
        const Message = mongoose.model('Message', MessageSchema, 'messages');

        const messageWithMedia = await Message.findOne({ mediaUrl: { $exists: true, $ne: null } });
        console.log("Message with media:", JSON.stringify(messageWithMedia, null, 2));

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

check();
