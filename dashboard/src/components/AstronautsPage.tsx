import { useState } from 'react';
import {
  Users, Activity, ShieldCheck, Lock, X, ArrowRight,
  Heart, Droplet, Moon, Flame, Radio, CheckCircle2,
} from 'lucide-react';

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  rank: string;
  initials: string;
  status: 'Active' | 'Resting' | 'Exercise' | 'Sleep';
  score: number;
  hue: string;
  mission: string;
}

const CREW: CrewMember[] = [
  { id: 'AST-001', name: 'Cdr. Alex Rivera',   role: 'Mission Commander', rank: 'Commander',   initials: 'AR', status: 'Active',   score: 96, hue: 'cyan',   mission: 'Artemis VII' },
  { id: 'AST-002', name: 'Dr. Maya Chen',      role: 'Flight Surgeon',    rank: 'Lieutenant',  initials: 'MC', status: 'Active',   score: 94, hue: 'violet', mission: 'Artemis VII' },
  { id: 'AST-003', name: 'Lt. J. Okafor',      role: 'Flight Engineer',   rank: 'Lieutenant',  initials: 'JO', status: 'Resting',  score: 89, hue: 'blue',   mission: 'Artemis VII' },
  { id: 'AST-004', name: 'S. Ivanova',         role: 'Science Officer',   rank: 'Specialist',  initials: 'SI', status: 'Active',   score: 91, hue: 'emerald',mission: 'Artemis VII' },
  { id: 'AST-005', name: 'M. Tanaka',          role: 'Payload Specialist',rank: 'Specialist',  initials: 'MT', status: 'Exercise', score: 87, hue: 'amber',  mission: 'Artemis VII' },
  { id: 'AST-006', name: 'R. Al-Farsi',        role: 'Systems Engineer',  rank: 'Lieutenant',  initials: 'RA', status: 'Active',   score: 93, hue: 'rose',   mission: 'Artemis VII' },
];

const scoreColor = (s: number) => (s >= 92 ? 'emerald' : s >= 88 ? 'cyan' : s >= 82 ? 'amber' : 'rose');

const StatusChip = ({ status }: { status: CrewMember['status'] }) => {
  const icon =
    status === 'Active' ? <CheckCircle2 size={12} /> :
    status === 'Resting' ? <Moon size={12} /> :
    status === 'Exercise' ? <Flame size={12} /> :
    <Moon size={12} />;
  const cls = status === 'Active' ? 'active' : status === 'Resting' ? 'resting' : status === 'Exercise' ? 'exercise' : 'sleep';
  return <span className={`crew-status crew-status-${cls}`}>{icon}{status}</span>;
};

export const AstronautsPage = () => {
  const [selected, setSelected] = useState<CrewMember | null>(null);

  const activeCount = CREW.filter((c) => c.status === 'Active').length;
  const avgScore = Math.round(CREW.reduce((a, c) => a + c.score, 0) / CREW.length);

  return (
    <div className="page-stack animate-fadeIn">
      <div className="page-title-row">
        <div>
          <span className="eyebrow"><Users size={12} /> CREW DIRECTORY</span>
          <h1>Astronaut Health Overview</h1>
          <p>Public mission-readiness scores for the current crew. Detailed vitals are protected by crew privacy policy.</p>
        </div>
        <span className="status-pill"><span className="status-dot" />{CREW.length} Crew Aboard</span>
      </div>

      <div className="crew-summary-row">
        <div className="crew-summary-tile">
          <div className="summary-icon"><Users size={18} /></div>
          <span className="summary-label">Total Crew</span>
          <strong>{CREW.length}</strong>
          <small>Artemis VII</small>
        </div>
        <div className="crew-summary-tile">
          <div className="summary-icon" style={{ color: '#6fe7c4', background: 'rgba(16,185,129,0.1)' }}>
            <Activity size={18} />
          </div>
          <span className="summary-label">Active Now</span>
          <strong>{activeCount}</strong>
          <small>On duty</small>
        </div>
        <div className="crew-summary-tile">
          <div className="summary-icon" style={{ color: '#60caff', background: 'rgba(14,165,233,0.1)' }}>
            <ShieldCheck size={18} />
          </div>
          <span className="summary-label">Avg Readiness</span>
          <strong>{avgScore}%</strong>
          <small>Mission-safe</small>
        </div>
        <div className="crew-summary-tile">
          <div className="summary-icon" style={{ color: '#fbbf65', background: 'rgba(245,158,11,0.1)' }}>
            <Lock size={18} />
          </div>
          <span className="summary-label">Privacy Mode</span>
          <strong>On</strong>
          <small>Vitals protected</small>
        </div>
      </div>

      <div className="crew-grid">
        {CREW.map((c) => {
          const color = scoreColor(c.score);
          return (
            <article key={c.id} className="crew-card">
              <div className="crew-card-head">
                <div className={`crew-avatar-lg hue-${c.hue}`}>{c.initials}</div>
                <div className="crew-card-id">
                  <strong>{c.name}</strong>
                  <span>{c.id} · {c.rank}</span>
                </div>
                <StatusChip status={c.status} />
              </div>

              <div className="crew-role-line">
                <Radio size={11} /> {c.role}
              </div>

              <div className="crew-score-block">
                <div className="crew-score-label">
                  <span>Overall Readiness</span>
                  <b className={`score-${color}`}>{c.score}%</b>
                </div>
                <div className="crew-score-bar">
                  <span style={{ width: `${c.score}%` }} className={`bar-${color}`} />
                </div>
              </div>

              <div className="crew-locked-metrics">
                <div><Heart size={13} /><span>Heart Rate</span><Lock size={11} className="lock-ico" /></div>
                <div><Droplet size={13} /><span>Blood O₂</span><Lock size={11} className="lock-ico" /></div>
                <div><Moon size={13} /><span>Sleep</span><Lock size={11} className="lock-ico" /></div>
              </div>

              <button className="crew-view-btn" onClick={() => setSelected(c)}>
                View Public Profile <ArrowRight size={13} />
              </button>
            </article>
          );
        })}
      </div>

      <div className="privacy-note-card">
        <Lock size={16} />
        <div>
          <strong>Crew privacy respected</strong>
          <p>Detailed medical telemetry (heart rate, blood pressure, SpO₂, sleep, etc.) is end-to-end encrypted and only visible to the astronaut and their flight surgeon. Only the overall mission-readiness score is shared across the crew dashboard.</p>
        </div>
      </div>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="crew-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)} aria-label="Close"><X size={18} /></button>

            <div className="crew-modal-head">
              <div className={`crew-avatar-lg hue-${selected.hue} crew-avatar-xl`}>{selected.initials}</div>
              <div>
                <span className="eyebrow">PUBLIC PROFILE</span>
                <h2>{selected.name}</h2>
                <p>{selected.role} · {selected.id}</p>
                <StatusChip status={selected.status} />
              </div>
            </div>

            <div className="crew-modal-score">
              <div className="score-ring" style={{ background: `conic-gradient(#34d399 ${selected.score * 3.6}deg, rgba(255,255,255,0.06) 0deg)` }}>
                <div><strong>{selected.score}%</strong><span>Readiness</span></div>
              </div>
              <div className="crew-modal-score-copy">
                <span>Mission Readiness</span>
                <b>Cleared for duty</b>
                <p>This astronaut is mission-cleared. Detailed vitals are restricted to their flight surgeon.</p>
              </div>
            </div>

            <div className="crew-modal-locked">
              <div className="crew-modal-locked-head">
                <Lock size={13} /> Private Health Metrics
              </div>
              <div className="crew-modal-metrics">
                <div><Heart size={15} /><span>Heart Rate</span><b>••• bpm</b></div>
                <div><Droplet size={15} /><span>SpO₂</span><b>••• %</b></div>
                <div><Moon size={15} /><span>Sleep</span><b>••• h</b></div>
                <div><Flame size={15} /><span>Calories</span><b>••• kcal</b></div>
              </div>
              <p className="crew-modal-locked-note">Crew privacy policy • Only the astronaut and their designated flight surgeon can view detailed telemetry.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};