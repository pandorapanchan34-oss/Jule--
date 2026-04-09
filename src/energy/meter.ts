// ─────────────────────────────────────────────
// Energy Meter
//
// Energy = ΔT × R
//        = ΔT × (ΔT / T_baseline)
//        = ΔT² / T_baseline
//
// ΔT = T_baseline - T_actual  (token reduction)
// R  = ΔT / T_baseline        (reduction rate 0-1)
//
// Quadratic reward: the more you reduce,
// the higher the reduction rate → exponential gain.
// ─────────────────────────────────────────────
import type { AuditLogEntry } from '../types/index.js';

export interface EnergyComponents {
  T_baseline: number;  // avg tokens (system baseline)
  T_actual:   number;  // actual tokens in this submission
  delta_T:    number;  // T_baseline - T_actual
  R:          number;  // delta_T / T_baseline (reduction rate)
  energy:     number;  // delta_T × R = delta_T² / T_baseline
}

export interface EnergyReport {
  period_start:        number;
  period_end:          number;
  total_submissions:   number;
  total_energy:        number;
  mean_energy:         number;
  baseline_used:       number;
  distribution_credit: number;
  top_contributors:    Array<{
    transmission_id: string;
    energy:          number;
    R:               number;
  }>;
}

export class EnergyMeter {
  private entries:  AuditLogEntry[] = [];
  private baseline: number;

  constructor(initialBaseline: number = 500) {
    this.baseline = initialBaseline;
  }

  // ── Core Formula ───────────────────────────
  static calculate(
    T_actual:   number,
    T_baseline: number
  ): EnergyComponents {
    const delta_T = Math.max(0, T_baseline - T_actual);
    const R       = T_baseline > 0 ? delta_T / T_baseline : 0;
    const energy  = delta_T * R; // = delta_T² / T_baseline
    return { T_baseline, T_actual, delta_T, R, energy };
  }

  // ── Step 1: Baseline Generation ────────────
  // Dynamic: rolling EMA of recent submissions
  updateBaseline(T_actual: number): void {
    const ALPHA  = 0.05;
    this.baseline = (1 - ALPHA) * this.baseline + ALPHA * T_actual;
  }

  getBaseline(): number { return this.baseline; }

  // ── Step 2: Actual Measurement ─────────────
  measure(T_actual: number): EnergyComponents {
    return EnergyMeter.calculate(T_actual, this.baseline);
  }

  // ── Step 3: Energy Calculation ─────────────
  // Mutates baseline after measurement
  calcEnergy(T_actual: number): EnergyComponents {
    const components = this.measure(T_actual);
    this.updateBaseline(T_actual);
    return components;
  }

  // ── Step 4: Distribution Calculation ────────
  static distributeJule(
    energy:            number,
    distribution_rate: number = 0.10,
    J_MAX:             number = 100
  ): number {
    const normalized = Math.min(energy / (J_MAX * J_MAX), 1);
    return normalized * J_MAX * distribution_rate;
  }

  // ── Full Pipeline ───────────────────────────
  // baseline → actual → energy → distribution
  run(T_actual: number, distribution_rate: number = 0.10): {
    components:   EnergyComponents;
    distribution: number;
  } {
    const components   = this.calcEnergy(T_actual);
    const distribution = EnergyMeter.distributeJule(
      components.energy, distribution_rate
    );
    return { components, distribution };
  }

  // ── Record & Report ─────────────────────────
  record(entry: AuditLogEntry): void {
    this.entries.push(entry);
  }

  generateReport(
    period_start:      number,
    period_end:        number,
    distribution_rate: number = 0.10
  ): EnergyReport {
    const period = this.entries.filter(
      e => e.timestamp >= period_start && e.timestamp <= period_end
    );
    const total_energy = period.reduce(
      (a, e) => a + e.energy_saved, 0
    );
    const top = [...period]
      .sort((a, b) => b.energy_saved - a.energy_saved)
      .slice(0, 10)
      .map(e => ({
        transmission_id: e.transmission_id,
        energy:          e.energy_saved,
        R:               0,
      }));

    return {
      period_start, period_end,
      total_submissions:   period.length,
      total_energy,
      mean_energy:         period.length > 0
                           ? total_energy / period.length : 0,
      baseline_used:       this.baseline,
      distribution_credit: total_energy * distribution_rate,
      top_contributors:    top,
    };
  }
}
