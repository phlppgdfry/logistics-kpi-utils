import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dwellHours, delayMinutes, onTimeRate, summarizeDwell } from '../src/index.js';
const at = '2026-10-12T08:00:00Z';
test('dwell uses elapsed hours across explicit offsets', () => {
  assert.equal(dwellHours('2026-10-12T10:00:00+02:00', '2026-10-12T12:30:00+02:00'), 2.5);
});
test('zero dwell remains zero', () => assert.equal(dwellHours(at, at), 0));
test('negative dwell is rejected', () => assert.throws(() => dwellHours(at, '2026-10-12T07:00:00Z'), RangeError));
test('signed delay distinguishes early and late', () => {
  assert.equal(delayMinutes(at, '2026-10-12T07:45:00Z'), -15);
  assert.equal(delayMinutes(at, '2026-10-12T08:15:00Z'), 15);
});
test('timezone-less and invalid calendar dates are rejected', () => {
  for (const bad of ['2026-10-12T08:00:00', '2026-02-30T08:00:00Z', '2026-13-01T08:00:00Z', '2026-10-12T24:00:00Z', 'junk'])
    assert.throws(() => dwellHours(bad, at));
});
test('valid Date objects work without mutating inputs', () => {
  const start = new Date(at);
  assert.equal(dwellHours(start, new Date('2026-10-12T09:00:00Z')), 1);
  assert.equal(start.toISOString(), at.replace('Z', '.000Z'));
  assert.throws(() => dwellHours(new Date('bad'), start));
});
test('on-time denominator excludes unknown arrivals and includes early arrivals', () => {
  assert.deepEqual(onTimeRate([
    { id:'1', planned:at, actual:'2026-10-12T07:59:00Z' },
    { id:'2', planned:at, actual:'2026-10-12T08:01:00Z' },
    { id:'3', planned:at, actual:null },
  ]), { total:3, evaluated:2, excluded:1, onTime:1, late:1, rate:0.5 });
});
test('tolerance boundary is inclusive', () => {
  assert.equal(onTimeRate([{id:'1', planned:at, actual:'2026-10-12T08:05:00Z'}], {toleranceMinutes:5}).rate, 1);
});
test('empty data returns null rates and averages', () => {
  assert.equal(onTimeRate([]).rate, null);
  assert.deepEqual(summarizeDwell([]), {total:0,evaluated:0,excluded:0,meanHours:null,medianHours:null,p95Hours:null,minHours:null,maxHours:null});
});
test('bad tolerances are rejected', () => {
  for (const toleranceMinutes of [-1, NaN, Infinity, '5'])
    assert.throws(() => onTimeRate([], {toleranceMinutes}), RangeError);
});
test('duplicate ids cannot inflate KPIs', () => {
  assert.throws(() => onTimeRate([{id:'1'},{id:'1'}]), /duplicate/);
  assert.throws(() => summarizeDwell([{id:'1'},{id:'1'}]), /duplicate/);
});
test('records need ids and an array', () => {
  assert.throws(() => onTimeRate({}));
  assert.throws(() => summarizeDwell([{id:' '}])) ;
  assert.throws(() => onTimeRate([null]));
});
test('dwell distribution uses R-7 interpolation and reports missing visits', () => {
  const visits = [1,2,3,4].map((hours, i) => ({id:String(i),gateIn:at,gateOut:`2026-10-12T${String(8+hours).padStart(2,'0')}:00:00Z`}));
  visits.push({id:'open',gateIn:at,gateOut:null});
  assert.deepEqual(summarizeDwell(visits), {total:5,evaluated:4,excluded:1,meanHours:2.5,medianHours:2.5,p95Hours:3.8499999999999996,minHours:1,maxHours:4});
});
test('malformed provided times are not hidden as missing data', () => {
  assert.throws(() => onTimeRate([{id:'1',planned:'bad',actual:null}]));
  assert.throws(() => summarizeDwell([{id:'1',gateIn:'bad',gateOut:null}]));
});
test('single completed visit has identical percentiles', () => {
  const summary = summarizeDwell([{id:'1',gateIn:at,gateOut:'2026-10-12T09:00:00Z'}]);
  assert.equal(summary.medianHours,1);assert.equal(summary.p95Hours,1);
});
test('elapsed dwell crosses daylight saving using offsets', () => {
  assert.equal(dwellHours('2026-10-25T01:30:00+02:00','2026-10-25T03:30:00+01:00'),3);
});
