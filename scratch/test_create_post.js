const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://akujiezeJoseph:QtPDm_n6SPMtZd2@cluster0.ayvoh7i.mongodb.net/ai-code-reviewer?appName=Cluster0";

async function testCreate() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const PostSchema = new mongoose.Schema({
            authorId: { type: mongoose.Schema.Types.ObjectId, required: true },
            text: { type: String, required: true },
            images: [{ type: String }],
            video: { type: String }
        }, { timestamps: true });
        
        const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);

        const newPost = await Post.create({
            authorId: new mongoose.Types.ObjectId("69c59960d6c5dad4c07b5d54"),
            text: "Test post with images",
            images: ["https://res.cloudinary.com/demo/image/upload/sample.jpg"],
            video: "https://res.cloudinary.com/demo/video/upload/dog.mp4"
        });

        console.log("Created post:", JSON.stringify(newPost, null, 2));

        const fetchedPost = await Post.findById(newPost._id);
        console.log("Fetched post:", JSON.stringify(fetchedPost, null, 2));

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

testCreate();
