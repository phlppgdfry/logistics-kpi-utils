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

export type ArrivalState = 'completed' | 'pending' | 'overdue' | 'unscheduled';
export interface ArrivalStatusSummary {
  total: number; asOf: string; completed: number; pending: number; overdue: number; unscheduled: number;
  /** Subset of non-completed rows with a provided actual timestamp after asOf. */
  futureActualExcluded: number;
  states: { id: string; status: ArrivalState; futureActual: boolean }[];
}
export function summarizeArrivalStatus(arrivals: Arrival[], options: { asOf: Timestamp; toleranceMinutes?: number }): ArrivalStatusSummary;
