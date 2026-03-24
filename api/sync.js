import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // If no DB configured, just return empty to not crash
  if (!process.env.KV_REST_API_URL) {
    if (req.method === 'GET') return res.status(200).json({});
    if (req.method === 'POST') return res.status(200).json({ success: false, notConfigured: true });
  }

  if (req.method === 'GET') {
    try {
      const data = await kv.get('ams_data');
      return res.status(200).json(data || {});
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const data = req.body;
      await kv.set('ams_data', data);
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}
