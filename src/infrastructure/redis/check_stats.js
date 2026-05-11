
const { getRedisClient } = require('./src/infrastructure/redis/redisClient');

async function checkStats() {
  try {
    const redis = await getRedisClient();
    const activeConnections = await redis.get('stats:activeConnections');
    const totalUsers = await redis.get('stats:totalUsers');
    console.log('--- REDIS STATS ---');
    console.log('Active Connections:', activeConnections);
    console.log('Total Users:', totalUsers);
    
    // Check keys
    const keys = await redis.keys('stats:*');
    console.log('Stats Keys:', keys);
    
    process.exit(0);
  } catch (err) {
    console.error('Error checking stats:', err);
    process.exit(1);
  }
}

checkStats();
