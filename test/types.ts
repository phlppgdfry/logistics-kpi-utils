import { dwellHours, delayMinutes, onTimeRate, summarizeDwell, summarizeArrivalStatus,
  type Arrival, type ArrivalStatusSummary, type ArrivalState } from '../src/index.js';
const rows: Arrival[] = [{id:'1', planned:'2026-10-12T08:00:00Z', actual:null}];
const state: ArrivalStatusSummary = summarizeArrivalStatus(rows,{asOf:new Date(),toleranceMinutes:5});
const classification: ArrivalState = state.states[0].status;
const number: number = dwellHours(new Date(),new Date());
const delay: number = delayMinutes(new Date(),new Date());
const rate: number | null = onTimeRate(rows).rate;
const median: number | null = summarizeDwell([{id:'1',gateIn:new Date(),gateOut:null}]).medianHours;
void [classification,number,delay,rate,median];
// @ts-expect-error an explicit asOf instant is required
summarizeArrivalStatus(rows,{});
// @ts-expect-error IDs must be strings
onTimeRate([{id:42}]);
// @ts-expect-error a rate can be null
const guaranteedRate: number = onTimeRate(rows).rate;
// @ts-expect-error timestamps must be strings or Date objects
dwellHours(1000,2000);
