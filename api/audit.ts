// api/audit.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, text, v, usefulRatio, k, repetition } = req.body;

  // Jule計算
  const sigma    = Math.exp(-((v-8)**2 + (v+5-v)**2) / 200);
  const deltaH   = (v/100) * usefulRatio * sigma * k;
  const decay    = Math.pow(0.5, repetition || 0);
  const jule     = Math.min(100, Math.tanh(v/50) * deltaH * decay * 100);
  const net      = jule - 10;
  const status   = net >= 0 ? 'ISSUED' : 'BURN';

  if (status === 'ISSUED') {
    // 残高更新
    const balKey = `jule:balance:${userId}`;
    await redis.incrbyfloat(balKey, net);
  }

  res.json({ status, jule, net, v, deltaH });
}
