static calculate(
  T_actual: number,
  globalBaseline: number,
  localBaseline: number
): EnergyComponents {

  const baseline = Math.max(globalBaseline, localBaseline);

  const delta_T = Math.max(0, baseline - T_actual);
  const R       = baseline > 0 ? delta_T / baseline : 0;

  // 安定化版 Energy
  const energy  = delta_T * Math.sqrt(R);

  return { T_baseline: baseline, T_actual, delta_T, R, energy };
}
