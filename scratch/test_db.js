const mongoose = require('mongoose');

async function test() {
  const uri = "mongodb+srv://akujiezeJoseph:QtPDm_n6SPMtZd2@cluster0.ayvoh7i.mongodb.net/ai-code-reviewer?appName=Cluster0";
  console.log("Connecting to:", uri);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("Successfully connected to MongoDB Atlas!");
    process.exit(0);
  } catch (err) {
    console.error("Connection failed:", err.message);
    process.exit(1);
  }
}

test();
