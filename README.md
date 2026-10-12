# Logistics KPI Utils

[![Tests](https://github.com/phlppgdfry/logistics-kpi-utils/actions/workflows/ci.yml/badge.svg)](https://github.com/phlppgdfry/logistics-kpi-utils/actions/workflows/ci.yml)

Small, dependency-free JavaScript library with TypeScript declarations for logistics and terminal dashboards. **Preview v0.2.0 · Node.js 22+ · ESM.** No network calls, storage, cloud account or customer data.

## Install

Published to **GitHub Packages**, not npmjs.org. Configure the `@phlppgdfry` scope to `https://npm.pkg.github.com` and authenticate locally with a personal access token (classic) carrying `read:packages`. GitHub's npm registry requires authentication even for public packages. Keep credentials out of committed `.npmrc` files. Actions can use `GITHUB_TOKEN` with package access.

```bash
npm install @phlppgdfry/logistics-kpi-utils@0.2.0 --registry=https://npm.pkg.github.com
```

Alternatively download the `.tgz` from the GitHub release and install it locally without registry authentication:

```bash
npm install ./phlppgdfry-logistics-kpi-utils-0.2.0.tgz
```

## Example

```js
import { dwellHours, onTimeRate } from '@phlppgdfry/logistics-kpi-utils';

dwellHours('2026-10-12T08:00:00Z', '2026-10-12T10:30:00Z'); // 2.5
onTimeRate([
  { id: 'call-1', planned: '2026-10-12T08:00:00Z', actual: '2026-10-12T08:04:00Z' },
  { id: 'call-2', planned: '2026-10-12T09:00:00Z', actual: null },
], { toleranceMinutes: 5 });
// { total: 2, evaluated: 1, excluded: 1, onTime: 1, late: 0, rate: 1 }
```

## Metric definitions

| Function | Meaning | Missing or invalid input |
| --- | --- | --- |
| `dwellHours(gateIn, gateOut)` | Elapsed hours; gate-out minus gate-in | Invalid timestamps and negative dwell throw |
| `delayMinutes(planned, actual)` | Signed minutes; negative is early | Invalid timestamps throw |
| `onTimeRate(arrivals, options)` | Arrivals at or before planned + tolerance / evaluable arrivals | Missing timestamps excluded and counted; no denominator gives `null` |
| `summarizeArrivalStatus(arrivals, { asOf, toleranceMinutes })` | Completed, pending, overdue and unscheduled counts at an explicit instant | Invalid values throw; future actual times are excluded from completion and reported |
| `summarizeDwell(visits)` | Completed visit mean, median, p95, min and max, in hours | Open/missing visits excluded and counted; empty statistics give `null` |

The on-time rate is a fraction from 0 to 1, not a percentage. It describes completed, evaluable arrivals; overdue arrivals without actual times are **not** counted as on time or late. Track pending and overdue calls separately before drawing operational conclusions. Dwell statistics describe completed visits and can underrepresent long-running open visits.

Both aggregate functions require unique, non-empty string IDs and reject duplicates instead of silently inflating counts. Use a visit ID for repeated visits by the same vehicle. Percentiles use linear interpolation: index `(n - 1) * p` in the sorted sample (R-7). Results are not rounded; presentation is the caller's responsibility. Tolerance must be finite and non-negative.

Timestamp inputs accept valid `Date` objects or ISO strings with seconds and explicit `Z`/`±HH:mm` offset. Impossible calendar dates, timezone-less strings and invalid Date objects are rejected. Elapsed durations use UTC milliseconds, including timezone and DST differences; leap seconds are unsupported. Missing means `null` or `undefined`, not an empty string. No current time is inferred.

## Development

```bash
npm ci
npm test
npm run example
npm pack
```

Tests cover offsets, daylight saving, negative dwell, early arrival, tolerance boundaries, missing data, denominators, malformed dates, duplicate IDs and percentile calculations. CI also installs the packed artifact into a clean temporary consumer and tests its published exports. GitHub releases trigger publication only after tests pass and the release tag matches `package.json`.

See [CHANGELOG.md](CHANGELOG.md). MIT licensed. Synthetic examples are illustrations, not claims about an actual terminal's performance.

## Arrival classification at a scenario clock

`summarizeArrivalStatus` requires `asOf`; it never reads the current system clock. A recorded actual arrival at or before `asOf` is completed. Otherwise a missing plan is unscheduled, a plan whose deadline (including tolerance) has passed is overdue, and a remaining plan is pending. At the exact deadline the arrival is still pending. Future actual timestamps are flagged and never treated as completed. The four status counts sum to `total`; `futureActualExcluded` is an additional anomaly count, not a fifth status.

Use this classification to select completed arrivals before calculating `onTimeRate`. This keeps future-dated actual records out of an as-of dashboard's punctuality denominator. No business holiday calendar, prediction or working-hours assumption is applied.

TypeScript declarations are compiled in CI with positive examples and expected type errors. [Synthetic fixture and expected values](examples/scenario.json) support independent reproduction.
