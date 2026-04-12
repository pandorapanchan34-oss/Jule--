export const config = { runtime: 'nodejs' };

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url:   process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const ids = await redis.lrange('jule:market:listings', 0, 49) as string[];
    if (!ids.length) return res.status(200).json({ listings: [] });
    const listings = await Promise.all(ids.map(id => redis.hgetall(`jule:listing:${id}`)));
    return res.status(200).json({ listings: listings.filter(Boolean) });
  }

  if (req.method === 'POST') {
    const { userId, seedId, price } = req.body || {};
    if (!userId || !seedId || !price) return res.status(400).json({ error: 'Missing fields' });

    const seed = await redis.hgetall(`jule:seed:${seedId}`);
    if (!seed) return res.status(404).json({ error: 'Seed not found' });

    const listingId = 'L-' + Date.now();
    await redis.hset(`jule:listing:${listingId}`, { id:listingId, seedId, seed, price, seller:userId });
    await redis.lpush('jule:market:listings', listingId);
    await redis.lrem(`jule:user:${userId}:seeds`, 0, seedId);

    return res.status(200).json({ listingId });
  }

  return res.status(405).end();
}
