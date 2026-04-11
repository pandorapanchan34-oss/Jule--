import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url:   process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, listingId } = req.body;
  if (!userId || !listingId) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const listing = await redis.hgetall(`jule:listing:${listingId}`) as any;
  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  // 残高確認
  const balKey  = `jule:balance:${userId}`;
  const balance = parseFloat((await redis.get(balKey) as string) || '500');

  if (balance < listing.price) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  // 取引実行
  await redis.set(balKey, balance - listing.price);
  await redis.lpush(`jule:user:${userId}:seeds`, listing.seedId);
  await redis.lrem('jule:market:listings', 0, listingId);
  await redis.del(`jule:listing:${listingId}`);

  return res.status(200).json({
    success: true,
    seed:    listing.seed,
    balance: balance - listing.price,
  });
}
