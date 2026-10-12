import { onTimeRate, summarizeDwell } from '../src/index.js';
// Synthetic examples; no terminal or customer data.
const arrivals = [
  { id:'call-1', planned:'2026-10-12T08:00:00Z', actual:'2026-10-12T08:04:00Z' },
  { id:'call-2', planned:'2026-10-12T09:00:00Z', actual:'2026-10-12T09:20:00Z' },
  { id:'call-3', planned:'2026-10-12T10:00:00Z', actual:null },
];
const visits = [
  { id:'visit-1', gateIn:'2026-10-12T06:00:00Z', gateOut:'2026-10-12T08:00:00Z' },
  { id:'visit-2', gateIn:'2026-10-12T06:00:00Z', gateOut:'2026-10-12T10:00:00Z' },
  { id:'visit-3', gateIn:'2026-10-12T07:00:00Z', gateOut:null },
];
console.log(JSON.stringify({onTime:onTimeRate(arrivals,{toleranceMinutes:5}),dwell:summarizeDwell(visits)},null,2));
