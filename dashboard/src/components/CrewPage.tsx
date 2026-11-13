import { useState } from 'react';
import { Lock, ShieldCheck, Users, X, HeartPulse, Heart, Droplet, Moon } from 'lucide-react';
import './crew.css';

type Tone = 'excellent' | 'good' | 'monitor';
type RegisteredUser = {
  id: string;
  full_name: string;
  email: string;
  badge_id: string;
  position: string;
  healthScore: number;
  metrics: {
    heartRate: number;
    spo2: number;
    sleep: number;
    [key: string]: any;
  };
};

type Props = {
  displayName: string;
  badgeId: string;
  userId: string;
  userEmail: string;
  ownReadiness: number;
  allUsers: RegisteredUser[];
  onViewOwn: () => void;
  onEditProfile: () => void;
};

const toneOf = (p: number): Tone => (p >= 85 ? 'excellent' : p >= 70 ? 'good' : 'monitor');
const labelOf = (t: Tone) => (t === 'excellent' ? 'Excellent' : t === 'good' ? 'Good' : 'Needs monitoring');
const ringColor = (t: Tone) => (t === 'excellent' ? '#34d399' : t === 'good' ? '#38bdf8' : '#fbbf24');
const initials = (n: string) => n.replace(/^(Dr\.|Lt\.)\s*/, '').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export function CrewPage({ displayName, badgeId, userId, userEmail, ownReadiness, allUsers, onViewOwn, onEditProfile }: Props) {
  const [selected, setSelected] = useState<RegisteredUser | null>(null);

  const me: RegisteredUser = {
    id: userId,
    full_name: displayName,
    email: userEmail,
    badge_id: badgeId,
    position: 'Mission Commander',
    healthScore: ownReadiness,
    metrics: { heartRate: 72, spo2: 98, sleep: 7.8 } // Dummy vitals for display only
  };

  const otherUsers = allUsers.filter(u => u.id !== userId && u.email !== userEmail);
  const crew = [me, ...otherUsers];

  const avg = Math.round(crew.reduce((s, c) => s + c.healthScore, 0) / crew.length);
  const count = (t: Tone) => crew.filter((c) => toneOf(c.healthScore) === t).length;

  return (
    <div className="page-stack animate-fadeIn">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">CREW OVERVIEW</span>
          <h1>Astronauts</h1>
          <p>See how the whole crew is doing. Only overall readiness is shared; detailed health data stays private.</p>
        </div>
        <button className="ghost-button" onClick={onEditProfile}>Edit my profile</button>
      </div>

      <div className="crew-stats">
        <article className="summary-tile"><span className="summary-icon"><Users size={18} /></span><span className="summary-label">Crew members</span><strong>{crew.length}</strong><small>On active mission</small></article>
        <article className="summary-tile"><span className="summary-icon"><HeartPulse size={18} /></span><span className="summary-label">Crew readiness</span><strong>{avg}%</strong><small>Average across the crew</small></article>
        <article className="summary-tile"><span className="summary-icon"><ShieldCheck size={18} /></span><span className="summary-label">Excellent or good</span><strong>{count('excellent') + count('good')}</strong><small>Ready for mission tasks</small></article>
        <article className="summary-tile"><span className="summary-icon"><Lock size={18} /></span><span className="summary-label">Needs monitoring</span><strong>{count('monitor')}</strong><small>Flagged to medical team</small></article>
      </div>

      <div className="crew-grid">
        {crew.map((c) => {
          const tone = toneOf(c.healthScore);
          const you = c.id === userId;
          
          return (
            <button key={c.id} className={`crew-card ${you ? 'is-you' : ''}`} onClick={() => setSelected(c)}>
              <div className="crew-card-head">
                <div className="crew-avatar">{initials(c.full_name)}</div>
                <div className="crew-info">
                  <strong>{c.full_name}</strong>
                  <span>{c.position || 'Crew Member'}</span>
                  <span className="badge">{c.badge_id}</span>
                </div>
                {you && <span className="you-tag">You</span>}
              </div>

              <div className="crew-card-body">
                <div className="score-ring-large" style={{ background: `conic-gradient(${ringColor(tone)} ${c.healthScore * 3.6}deg, rgba(255,255,255,0.05) 0deg)` }}>
                  <div className="score-ring-inner">
                    <strong>{c.healthScore}%</strong>
                    <span>Score</span>
                  </div>
                </div>
                <div className="vitals-list">
                  <div className="vital-item"><Heart size={14} className="vital-icon" /> <span>{c.metrics?.heartRate || 72} BPM</span></div>
                  <div className="vital-item"><Droplet size={14} className="vital-icon" /> <span>{c.metrics?.spo2 || 98}% SpO₂</span></div>
                  <div className="vital-item"><Moon size={14} className="vital-icon" /> <span>{c.metrics?.sleep || 7.8}h Sleep</span></div>
                </div>
              </div>

              <div className="crew-card-foot">
                <span className={`status-chip tone-${tone}`}><span className={`dot tone-${tone}`} />{labelOf(tone)}</span>
                <span className="checkin-time">{you ? 'Live' : 'Recently'}</span>
              </div>
            </button>
          );
        })}
      </div>

      {crew.length === 1 && (
        <div className="disclaimer-note" style={{ marginTop: '20px' }}>
          <Users size={14} />
          <span>No other astronauts have registered yet. Once other users sign up, they will appear here automatically.</span>
        </div>
      )}

      <div className="disclaimer-note"><Lock size={14} /><span>Privacy: other astronauts' heart rate, sleep, blood pressure and alerts are never shown here. Your own full data is in Health Analytics.</span></div>

      {selected && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="crew-modal" role="dialog" aria-label={`${selected.full_name} overall condition`}>
            <button className="icon-button" style={{ marginLeft: 'auto' }} onClick={() => setSelected(null)} aria-label="Close"><X size={16} /></button>
            <div className="crew-avatar" style={{ margin: '0 auto 10px', width: '64px', height: '64px' }}>{initials(selected.full_name)}</div>
            <h2>{selected.full_name}</h2>
            <p style={{ margin: 0 }}>{selected.position || 'Crew Member'} · {selected.badge_id}</p>
            
            <div className="big-ring" style={{ background: `conic-gradient(${ringColor(toneOf(selected.healthScore))} ${selected.healthScore * 3.6}deg, #17374b 0deg)` }}>
              <div>
                <div>
                  <strong>{selected.healthScore}%</strong>
                  <br />
                  <small style={{ color: '#8ea6ba' }}>readiness</small>
                </div>
              </div>
            </div>
            
            <span className={`status-chip tone-${toneOf(selected.healthScore)}`}>{labelOf(toneOf(selected.healthScore))}</span>
            
            {selected.id === userId ? (
              <button className="primary-button full-button" style={{ marginTop: '18px' }} onClick={() => { setSelected(null); onViewOwn(); }}>Open my full health data</button>
            ) : (
              <div className="lock-box"><Lock size={16} style={{ flex: '0 0 16px' }} /><span>Detailed vitals are private to this astronaut and the medical team.</span></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}