export function calculatePhi(
  current: string,
  recent: string[]
): number {
  if (recent.length === 0) return 1;

  const similarity = recent
    .map(r => jaccard(current, r))
    .reduce((a, b) => a + b, 0) / recent.length;

  const lambda = 2.0;
  return Math.exp(-lambda * similarity);
}

function jaccard(a: string, b: string): number {
  const A = new Set(a.split(" "));
  const B = new Set(b.split(" "));
  const intersection = new Set([...A].filter(x => B.has(x)));
  return intersection.size / (A.size + B.size - intersection.size);
}
