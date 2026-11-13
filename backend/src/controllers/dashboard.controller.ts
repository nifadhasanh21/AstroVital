// backend/src/controllers/dashboard.controller.ts
import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';

type RangeKey = '1D' | '1W' | '1M' | '3M';
type MetricKey =
  | 'heartRate' | 'spo2' | 'steps' | 'sleep' | 'water'
  | 'systolic' | 'diastolic' | 'temperature' | 'respiration';

const RANGE_DAYS: Record<RangeKey, number> = { '1D': 1, '1W': 7, '1M': 30, '3M': 90 };
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const toNumber = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;
    const m = s.match(/-?\d+(?:\.\d+)?/);
    if (!m) return null;
    const n = Number(m[0]);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof v === 'object') {
    for (const p of ['value', 'amount', 'number']) {
      const n = toNumber((v as any)[p]);
      if (n !== null) return n;
    }
    return null;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const rowTime = (row: any): Date | null => {
  const raw = row.recorded_at ?? row.created_at ?? row.timestamp;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
};

const resolveKey = (rawType: unknown): MetricKey | 'bloodPressure' | null => {
  const t = String(rawType || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  if (!t) return null;
  if (t.endsWith('sys') || t.endsWith('systolic') || t === 'sbp') return 'systolic';
  if (t.endsWith('dia') || t.endsWith('diastolic') || t === 'dbp') return 'diastolic';
  if (t.includes('systolic') || t === 'sys') return 'systolic';
  if (t.includes('diastolic') || t === 'dia') return 'diastolic';
  if (t.includes('bloodpressure') || t === 'bp') return 'bloodPressure';
  if (t.includes('spo2') || t.includes('oxygen') || t === 'o2') return 'spo2';
  if (t.includes('heart') || t.includes('pulse') || t.includes('bpm') || t === 'hr') return 'heartRate';
  if (t.includes('step')) return 'steps';
  if (t.includes('sleep')) return 'sleep';
  if (t.includes('water') || t.includes('hydration')) return 'water';
  if (t.includes('temp')) return 'temperature';
  if (t.includes('resp') || t.includes('breath')) return 'respiration';
  return null;
};

const normalize = (key: MetricKey, value: number): number => {
  if (key === 'sleep' && value > 24) return value / 60; 
  if (key === 'water' && value > 20) return value / 1000; 
  if (key === 'temperature' && value > 50) return ((value - 32) * 5) / 9; 
  return value;
};

const BP_SYSTOLIC_COLS = [
  'systolic', 'sys_bp', 'blood_pressure_systolic', 'bp_systolic',
  'value_systolic', 'systolic_bp', 'sbp', 'sys', 'systolic_pressure',
];
const BP_DIASTOLIC_COLS = [
  'diastolic', 'dia_bp', 'blood_pressure_diastolic', 'bp_diastolic',
  'value_diastolic', 'diastolic_bp', 'dbp', 'dia', 'diastolic_pressure',
];
const BP_COMBINED_COLS = ['blood_pressure', 'bp', 'bloodpressure', 'bp_reading', 'blood_pressure_reading'];

const pickNumeric = (row: any, cols: string[]): number | null => {
  for (const c of cols) {
    if (!(c in row)) continue;
    const v = toNumber(row[c]);
    if (v !== null) return v;
  }
  return null;
};

const parseBPString = (raw: unknown): [number | null, number | null] => {
  if (raw === null || raw === undefined) return [null, null];
  if (typeof raw === 'object') return [null, null];
  const str = String(raw);
  if (!str.includes('/')) return [null, null];
  const parts = str.split('/');
  if (parts.length < 2) return [null, null];
  return [toNumber(parts[0]), toNumber(parts[1])];
};

const extractBloodPressure = (row: any): Array<[MetricKey, number]> => {
  const out: Array<[MetricKey, number]> = [];
  let s: number | null = null;
  let d: number | null = null;

  const [vs, vd] = parseBPString(row.value ?? row.data ?? row.metric_value);
  if (vs !== null && vd !== null) { s = vs; d = vd; }

  if (s === null || d === null) {
    for (const col of BP_COMBINED_COLS) {
      if (!(col in row)) continue;
      const [cs, cd] = parseBPString(row[col]);
      if (cs !== null && cd !== null) { s = cs; d = cd; break; }
    }
  }

  if (s === null) s = pickNumeric(row, BP_SYSTOLIC_COLS);
  if (d === null) d = pickNumeric(row, BP_DIASTOLIC_COLS);

  if ((s === null || d === null) && row.value && typeof row.value === 'object') {
    const o: any = row.value;
    if (s === null) s = toNumber(o.systolic ?? o.Systolic ?? o.sys ?? o.sbp);
    if (d === null) d = toNumber(o.diastolic ?? o.Diastolic ?? o.dia ?? o.dbp);
  }

  if (s !== null && (s < 40 || s > 300)) s = null;
  if (d !== null && (d < 20 || d > 200)) d = null;

  if (s !== null) out.push(['systolic', s]);
  if (d !== null) out.push(['diastolic', d]);
  return out;
};

const extractFromRow = (row: any): Array<[MetricKey, number]> => {
  const out: Array<[MetricKey, number]> = [];
  const rawType = String(row.metric_type ?? row.type ?? row.metric ?? '').toLowerCase();
  const key = resolveKey(rawType);

  const addIfMissing = (k: MetricKey, v: number) => {
    if (!out.some(([ek]) => ek === k)) out.push([k, v]);
  };

  if (key === 'bloodPressure') {
    for (const [k, v] of extractBloodPressure(row)) addIfMissing(k, v);
  } else if (key === 'systolic' || key === 'diastolic') {
    const v = toNumber(row.value ?? row.data ?? row.metric_value);
    if (v !== null) addIfMissing(key, normalize(key, v));
    for (const [k, pv] of extractBloodPressure(row)) addIfMissing(k, pv);
  } else if (key) {
    const v = toNumber(row.value ?? row.data ?? row.metric_value);
    if (v !== null) addIfMissing(key, normalize(key, v));
  } else {
    for (const [k, v] of extractBloodPressure(row)) addIfMissing(k, v);
  }

  const wide: Array<[MetricKey, string[]]> = [
    ['heartRate', ['heart_rate', 'heartRate', 'bpm']], 
    ['spo2', ['spo2', 'SpO2', 'oxygen', 'blood_oxygen']], 
    ['steps', ['steps', 'step_count', 'total_steps']],
    ['sleep', ['sleep', 'sleep_hours', 'sleep_duration', 'total_sleep', 'sleep_duration_hours']],
    ['water', ['water', 'water_intake', 'water_ml', 'water_liters', 'hydration', 'water_intake_ml']],
    ['temperature', ['temperature', 'body_temperature', 'temp']], 
    ['respiration', ['respiration', 'respiratory_rate', 'breathing_rate']],
  ];

  for (const [k, cols] of wide) {
    if (out.some(([ek]) => ek === k)) continue;
    for (const c of cols) {
      if (!(c in row)) continue;
      const v = toNumber(row[c]);
      if (v !== null) { out.push([k, normalize(k, v)]); break; }
    }
  }
  return out;
};

const safeQuery = async (fn: () => PromiseLike<{ data: any; error: any }>): Promise<any[]> => {
  try {
    const { data, error } = await fn();
    if (error) { console.warn('Supabase query warning:', error.message); return []; }
    return data ?? [];
  } catch (e: any) {
    console.warn('Supabase query failed:', e?.message);
    return [];
  }
};

const bucketFor = (date: Date, range: RangeKey, since: Date): { key: string; label: string } => {
  if (range === '1D') {
    const h = Math.floor(date.getUTCHours() / 4) * 4;
    const label = `${String(h).padStart(2, '0')}:00`;
    return { key: `${date.toISOString().slice(0, 10)}-${label}`, label };
  }
  if (range === '1W') return { key: date.toISOString().slice(0, 10), label: WEEKDAYS[date.getUTCDay()] };
  if (range === '1M') {
    const w = Math.floor((date.getTime() - since.getTime()) / (7 * DAY_MS)) + 1;
    return { key: `W${w}`, label: `W${w}` };
  }
  return { key: `${date.getUTCFullYear()}-${date.getUTCMonth()}`, label: MONTHS[date.getUTCMonth()] };
};

const buildTrends = (rows: any[], range: RangeKey, since: Date) => {
  const buckets = new Map<string, { label: string; hr: number[]; spo2: number[]; steps: number }>();
  for (const row of rows) {
    const at = rowTime(row);
    if (!at) continue;
    const values = extractFromRow(row);
    if (!values.length) continue;
    const { key, label } = bucketFor(at, range, since);
    if (!buckets.has(key)) buckets.set(key, { label, hr: [], spo2: [], steps: 0 });
    const b = buckets.get(key)!;
    for (const [k, v] of values) {
      if (k === 'heartRate') b.hr.push(v);
      else if (k === 'spo2') b.spo2.push(v);
      else if (k === 'steps') b.steps = Math.max(b.steps, v);
    }
  }
  const avg = (a: number[]) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null);
  let lastHR = 0, lastSpO2 = 0;
  return Array.from(buckets.values()).map((b) => {
    const hr = avg(b.hr) ?? lastHR;
    const spo2 = avg(b.spo2) ?? lastSpO2;
    lastHR = hr; lastSpO2 = spo2;
    return { time: b.label, HR: hr, SpO2: spo2, Steps: Math.min(100, Math.round(b.steps / 100)) };
  });
};

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'Unauthorized.' });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ success: false, error: 'Invalid token.' });

    const range = (['1D', '1W', '1M', '3M'].includes(String(req.query.range)) ? String(req.query.range) : '1W') as RangeKey;
    const since = new Date(Date.now() - RANGE_DAYS[range] * DAY_MS);

    const metrics: Partial<Record<MetricKey, number>> = {};

    for (const table of ['daily_activity', 'daily_activities']) {
      const rows = await safeQuery(() =>
        supabaseAdmin.from(table).select('*').eq('user_id', user.id).order('recorded_at', { ascending: false }).limit(1),
      );
      if (rows.length) {
        for (const [k, v] of extractFromRow(rows[0])) {
           metrics[k] = v;
        }
        break;
      }
    }

    const latestRows = await safeQuery(() =>
      supabaseAdmin.from('health_records').select('*').eq('user_id', user.id).order('recorded_at', { ascending: false }).limit(100),
    );
    for (const row of latestRows) {
      const extracted = extractFromRow(row);
      for (const [k, v] of extracted) {
        if (metrics[k] === undefined) metrics[k] = v;
      }
    }

    const readings = await safeQuery(() =>
      supabaseAdmin.from('health_readings').select('*').eq('user_id', user.id).order('recorded_at', { ascending: false }).limit(1),
    );
    if (readings.length) {
      for (const [k, v] of extractFromRow(readings[0])) {
        if (metrics[k] === undefined) metrics[k] = v;
      }
    }

    const rangeRows = await safeQuery(() =>
      supabaseAdmin.from('health_records').select('*').eq('user_id', user.id).gte('recorded_at', since.toISOString()).order('recorded_at', { ascending: true }).limit(5000),
    );
    const trends = buildTrends(rangeRows, range, since);

    console.log(`📡 Returning Metrics to Frontend:`, metrics, 'BP:', {
      systolic: metrics.systolic ?? null,
      diastolic: metrics.diastolic ?? null,
    });
    return res.status(200).json({ success: true, metrics, trends });
  } catch (err: any) {
    console.error("Dashboard Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const simulateDeviceData = async (_req: Request, res: Response) => {
  return res.status(400).json({ success: false, error: 'Simulation disabled.' });
};