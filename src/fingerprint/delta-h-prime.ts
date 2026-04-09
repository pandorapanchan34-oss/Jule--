export function calculateDHPrime(
  dH: number,
  tokens: number,
  usefulTokens: number,
  modelFactor = 1
): number {
  const efficiency = usefulTokens / tokens;
  const energy = tokens * modelFactor;

  return dH * (efficiency / energy);
}
