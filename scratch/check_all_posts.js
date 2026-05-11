const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://akujiezeJoseph:QtPDm_n6SPMtZd2@cluster0.ayvoh7i.mongodb.net/ai-code-reviewer?appName=Cluster0";

async function check() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const PostSchema = new mongoose.Schema({}, { strict: false });
        const Post = mongoose.model('Post', PostSchema, 'posts');

        const totalPosts = await Post.countDocuments();
        console.log("Total posts:", totalPosts);

        const allPosts = await Post.find().limit(5);
        console.log("All posts (first 5):", JSON.stringify(allPosts, null, 2));

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

check();
