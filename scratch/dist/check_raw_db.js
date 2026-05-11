import mongoose from 'mongoose';
const MONGODB_URI = "mongodb+srv://akujiezeJoseph:QtPDm_n6SPMtZd2@cluster0.ayvoh7i.mongodb.net/ai-code-reviewer?appName=Cluster0";
async function checkDb() {
    console.log("TS: Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("TS: Connected to MongoDB");
    const db = mongoose.connection.db;
    if (!db) {
        console.error("TS: DB connection not found");
        process.exit(1);
    }
    // Check Posts
    const postCollection = db.collection('posts');
    console.log("TS: Fetching sample post...");
    const samplePost = await postCollection.findOne({});
    console.log("\nTS: Sample Post Keys:", samplePost ? Object.keys(samplePost) : "None");
    if (samplePost) {
        console.log("TS: Sample Post Data:", JSON.stringify(samplePost, null, 2));
    }
    // Check Messages
    const messageCollection = db.collection('messages');
    console.log("\nTS: Fetching sample message...");
    const sampleMessage = await messageCollection.findOne({});
    console.log("TS: Sample Message Keys:", sampleMessage ? Object.keys(sampleMessage) : "None");
    if (sampleMessage) {
        console.log("TS: Sample Message Data:", JSON.stringify(sampleMessage, null, 2));
    }
    await mongoose.disconnect();
    console.log("TS: Disconnected");
}
checkDb().catch(err => {
    console.error("TS: Error:", err);
    process.exit(1);
});
