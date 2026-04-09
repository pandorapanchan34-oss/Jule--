export function estimateEnergy(tokens: number, factor = 2e9): number {
  return tokens * factor;
}

export function distributeEnergyPool(pool: number) {
  return {
    validator: pool * 0.4,
    infra: pool * 0.3,
    users: pool * 0.2,
    burn: pool * 0.1
  };
}
