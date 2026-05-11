const mongoose = require('mongoose');

async function clean() {
  try {
    const uri = 'mongodb+srv://akujiezeJoseph:QtPDm_n6SPMtZd2@cluster0.ayvoh7i.mongodb.net/ai-code-reviewer?appName=Cluster0';
    console.log('Connecting to DB...');
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const result = await db.collection('users').updateMany(
      { profilePhoto: { $regex: 'pravatar', $options: 'i' } },
      { $set: { profilePhoto: '' } }
    );
    console.log('Cleaned ' + result.modifiedCount + ' users.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

clean();
