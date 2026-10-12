export type Timestamp = string | Date;
export interface Arrival { id: string; planned?: Timestamp | null; actual?: Timestamp | null; }
export interface Visit { id: string; gateIn?: Timestamp | null; gateOut?: Timestamp | null; }
export interface OnTimeSummary {
  total: number; evaluated: number; excluded: number; onTime: number; late: number;
  /** Fraction from 0 to 1; null when no completed arrivals can be evaluated. */
  rate: number | null;
}
export interface DwellSummary {
  total: number; evaluated: number; excluded: number;
  meanHours: number | null; medianHours: number | null; p95Hours: number | null;
  minHours: number | null; maxHours: number | null;
}
export function dwellHours(gateIn: Timestamp, gateOut: Timestamp): number;
export function delayMinutes(planned: Timestamp, actual: Timestamp): number;
export function onTimeRate(arrivals: Arrival[], options?: { toleranceMinutes?: number }): OnTimeSummary;
export function summarizeDwell(visits: Visit[]): DwellSummary;
