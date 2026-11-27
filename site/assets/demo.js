const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// Playground: imports the library file itself (copied unchanged from src/index.js at build time).
import { onTimeRate, summarizeDwell, summarizeArrivalStatus, delayMinutes } from './kpi.js';

const PRESETS = {
  'Repo scenario': {
    asOf: '2026-10-12T12:00:00Z', tol: 5,
    data: {
      arrivals: [
        { id: 'late-completed', planned: '2026-10-12T08:00:00Z', actual: '2026-10-12T08:20:00Z' },
        { id: 'on-time', planned: '2026-10-12T05:00:00Z', actual: '2026-10-12T05:04:00Z' },
        { id: 'overdue', planned: '2026-10-12T10:00:00Z', actual: null },
      ],
      visits: [{ id: 'visit-2', gateIn: '2026-10-12T05:04:00Z', gateOut: '2026-10-12T08:04:00Z' }],
    },
  },
  'Morning shift': {
    asOf: '2026-10-12T11:30:00+02:00', tol: 10,
    data: {
      arrivals: [
        { id: 'truck-101', planned: '2026-10-12T06:00:00+02:00', actual: '2026-10-12T05:52:00+02:00' },
        { id: 'truck-102', planned: '2026-10-12T06:30:00+02:00', actual: '2026-10-12T06:38:00+02:00' },
        { id: 'truck-103', planned: '2026-10-12T07:00:00+02:00', actual: '2026-10-12T07:41:00+02:00' },
        { id: 'truck-104', planned: '2026-10-12T08:00:00+02:00', actual: '2026-10-12T08:09:00+02:00' },
        { id: 'truck-105', planned: '2026-10-12T09:00:00+02:00', actual: null },
        { id: 'truck-106', planned: '2026-10-12T11:25:00+02:00', actual: null },
        { id: 'truck-107', planned: null, actual: null },
        { id: 'truck-108', planned: '2026-10-12T10:00:00+02:00', actual: '2026-10-12T13:00:00+02:00' },
      ],
      visits: [
        { id: 'v-101', gateIn: '2026-10-12T05:52:00+02:00', gateOut: '2026-10-12T07:10:00+02:00' },
        { id: 'v-102', gateIn: '2026-10-12T06:38:00+02:00', gateOut: '2026-10-12T09:02:00+02:00' },
        { id: 'v-103', gateIn: '2026-10-12T07:41:00+02:00', gateOut: '2026-10-12T08:20:00+02:00' },
        { id: 'v-104', gateIn: '2026-10-12T08:09:00+02:00', gateOut: null },
      ],
    },
  },
  'Bad data: duplicate id': {
    asOf: '2026-10-12T12:00:00Z', tol: 5,
    data: {
      arrivals: [
        { id: 'call-1', planned: '2026-10-12T08:00:00Z', actual: '2026-10-12T08:04:00Z' },
        { id: 'call-1', planned: '2026-10-12T08:00:00Z', actual: '2026-10-12T08:04:00Z' },
      ],
      visits: [],
    },
  },
  'Bad data: no timezone': {
    asOf: '2026-10-12T12:00:00Z', tol: 5,
    data: {
      arrivals: [{ id: 'call-1', planned: '2026-10-12T08:00:00', actual: '2026-10-12T08:04:00Z' }],
      visits: [],
    },
  },
};

const $ = id => document.getElementById(id);
const input = $('input'), asof = $('asof'), tol = $('tol');
const fmt = (x, d = 2) => x === null ? '<span class="dim">null</span>' : (+x.toFixed(d)).toString();

function tile(v, l, cls = '') { return `<div class="kpi-tile ${cls}"><div class="v">${v}</div><div class="l">${l}</div></div>`; }

function timeline(arrivals, cutoff, tolMin) {
  const svg = $('tl');
  const rows = arrivals.filter(a => a.planned || a.actual);
  const times = rows.flatMap(a => [a.planned, a.actual].filter(Boolean).map(t => Date.parse(t))).concat(cutoff);
  const min = Math.min(...times) - 30 * 60e3, max = Math.max(...times) + 30 * 60e3;
  const W = 640, L = 108, R = 16, rowH = 26, H = rows.length * rowH + 30;
  const x = t => L + (t - min) / (max - min) * (W - L - R);
  let s = '';
  for (let h = Math.ceil(min / 36e5) * 36e5; h <= max; h += 36e5) {
    const d = new Date(h);
    s += `<line x1="${x(h)}" x2="${x(h)}" y1="4" y2="${H - 22}" class="g"/><text x="${x(h)}" y="${H - 6}" class="t" text-anchor="middle">${String(d.getUTCHours()).padStart(2, '0')}:00Z</text>`;
  }
  rows.forEach((a, i) => {
    const y = 16 + i * rowH;
    s += `<text x="${L - 8}" y="${y + 4}" class="id" text-anchor="end">${a.id.slice(0, 15)}</text>`;
    if (a.planned) {
      const p = Date.parse(a.planned);
      s += `<rect x="${x(p)}" y="${y - 6}" width="${Math.max(1, x(p + tolMin * 6e4) - x(p))}" height="12" rx="3" class="z"/>`;
      s += `<circle cx="${x(p)}" cy="${y}" r="5" class="p"/>`;
    }
    if (a.actual) {
      const t = Date.parse(a.actual);
      const late = a.planned && delayMinutes(a.planned, a.actual) > tolMin;
      const fut = t > cutoff;
      if (a.planned) s += `<line x1="${x(Date.parse(a.planned))}" x2="${x(t)}" y1="${y}" y2="${y}" class="lnk"/>`;
      s += `<circle cx="${x(t)}" cy="${y}" r="5" class="a ${late ? 'late' : 'ok'} ${fut ? 'fut' : ''}"><title>${fut ? 'future actual: excluded at this clock' : ''}</title></circle>`;
    }
  });
  s += `<line x1="${x(cutoff)}" x2="${x(cutoff)}" y1="0" y2="${H - 22}" class="now"/><text x="${x(cutoff) + 4}" y="10" class="nowt">asOf</text>`;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = s;
}

function run() {
  $('tolv').textContent = tol.value;
  const err = $('err'), out = $('out');
  try {
    const data = JSON.parse(input.value);
    const t = Number(tol.value);
    const status = summarizeArrivalStatus(data.arrivals, { asOf: asof.value, toleranceMinutes: t });
    const done = new Set(status.states.filter(s => s.status === 'completed').map(s => s.id));
    const ot = onTimeRate(data.arrivals.filter(a => done.has(a.id)), { toleranceMinutes: t });
    const dw = summarizeDwell(data.visits || []);
    $('tiles').innerHTML =
      tile(ot.rate === null ? '—' : Math.round(ot.rate * 100) + '%', `on time · ${ot.onTime}/${ot.evaluated} completed`, 'big') +
      tile(status.completed, 'completed') + tile(status.pending, 'pending') +
      tile(status.overdue, 'overdue', status.overdue ? 'warn' : '') + tile(status.unscheduled, 'unscheduled') +
      tile(status.futureActualExcluded, 'future actual excluded', status.futureActualExcluded ? 'warn' : '') +
      tile(dw.meanHours === null ? '—' : fmt(dw.meanHours, 1) + ' h', `mean dwell · p95 ${dw.p95Hours === null ? '—' : fmt(dw.p95Hours, 1) + ' h'} · ${dw.evaluated} closed, ${dw.excluded} open`);
    timeline(data.arrivals, Date.parse(status.asOf), t);
    const { states, ...counts } = status;
    $('raw').textContent = JSON.stringify({ summarizeArrivalStatus: counts, onTimeRate: ot, summarizeDwell: dw }, null, 2);
    err.hidden = true; out.style.opacity = 1;
  } catch (e) {
    err.hidden = false; out.style.opacity = .35;
    err.innerHTML = `<b>${esc(e.name)}</b> ${esc(e.message)}<div class="small" style="margin-top:6px;opacity:.8">The library refuses this input instead of returning a misleading number.</div>`;
  }
}

function load(name) {
  const p = PRESETS[name];
  input.value = JSON.stringify(p.data, null, 2); asof.value = p.asOf; tol.value = p.tol;
  document.querySelectorAll('#presets button').forEach(b => b.setAttribute('aria-selected', b.textContent === name));
  run();
}
$('presets').innerHTML = Object.keys(PRESETS).map(n => `<button type="button" role="tab">${n}</button>`).join('');
$('presets').addEventListener('click', e => { if (e.target.tagName === 'BUTTON') load(e.target.textContent); });
[input, asof, tol].forEach(el => el.addEventListener('input', run));
load('Morning shift');
