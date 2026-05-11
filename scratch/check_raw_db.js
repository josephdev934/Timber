const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://akujiezeJoseph:QtPDm_n6SPMtZd2@cluster0.ayvoh7i.mongodb.net/ai-code-reviewer?appName=Cluster0";

async function check() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const db = mongoose.connection.db;
        const posts = await db.collection('posts').find().limit(10).toArray();
        
        console.log("Post keys:", posts.length > 0 ? Object.keys(posts[0]) : "No posts");
        if (posts.length > 0) {
            console.log("Sample post:", JSON.stringify(posts[0], null, 2));
        }

        const messages = await db.collection('messages').find().limit(10).toArray();
        console.log("Message keys:", messages.length > 0 ? Object.keys(messages[0]) : "No messages");
        if (messages.length > 0) {
            console.log("Sample message:", JSON.stringify(messages[0], null, 2));
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

check();
