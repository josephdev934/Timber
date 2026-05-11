const mongoose = require('mongoose');

// Define Schemas directly
const UserSchema = new mongoose.Schema({
  username: String,
  name: String,
  profilePhoto: String
});
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const PostSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String
});
const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);

async function debug() {
  const MONGO_URI = "mongodb+srv://akujiezeJoseph:QtPDm_n6SPMtZd2@cluster0.ayvoh7i.mongodb.net/ai-code-reviewer?appName=Cluster0";
  await mongoose.connect(MONGO_URI);
  console.log("Connected to DB");
  
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('authorId')
    .lean();
    
  console.log("Found Posts:", posts.length);
  if (posts.length > 0) {
    posts.forEach((p, i) => {
      console.log(`Post ${i} ID:`, p._id);
      console.log(`Post ${i} AuthorId:`, p.authorId);
    });
  }
  process.exit(0);
}

debug().catch(err => {
  console.error(err);
  process.exit(1);
});
