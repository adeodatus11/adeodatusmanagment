import Redis from 'ioredis';

const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

export default async function handler(req, res) {
  // If no DB configured, just return empty to not crash
  if (!redis) {
    if (req.method === 'GET') return res.status(200).json({});
    if (req.method === 'POST') return res.status(200).json({ success: false, notConfigured: true });
  }

  if (req.method === 'GET') {
    try {
      const rawData = await redis.get('ams_data');
      const data = rawData ? JSON.parse(rawData) : {};
      return res.status(200).json(data);
    } catch (error) {
      console.error('GET /api/sync Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const data = req.body;
      await redis.set('ams_data', JSON.stringify(data));
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('POST /api/sync Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}
