// dashboard/src/components/AuthModal.tsx
import { useState } from 'react';
import { Mail, Lock, User, Loader2, Award } from 'lucide-react';

const POSITIONS = [
  'Mission Commander', 'Pilot', 'Flight Engineer', 'Mission Specialist',
  'Payload Specialist', 'Medical Officer', 'EVA Specialist',
  'Robotics Operator', 'Science Officer'
];

type Props = {
  onSuccess: (user: any) => void;
};

export function AuthModal({ onSuccess }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState(POSITIONS[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email, password } 
        : { email, password, full_name: fullName, position };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (err) {
        throw new Error(`Server error (Status ${res.status}). Backend might be down or route not found.`);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
      }

      if (data.session?.access_token) {
        localStorage.setItem('astrovital_token', data.session.access_token);
      }

      // ✅ FIX: Database theke data asle seta priority pabe, na asle metadata/form state theke nibe
      const dbProfile = data.profile || {};
      const metadata = data.user_metadata || data.user?.user_metadata || {};

      const finalName = dbProfile.full_name || metadata.full_name || fullName || 'Astronaut';
      const finalPosition = dbProfile.position || metadata.position || position || 'Unassigned';
      const finalBadge = dbProfile.badge_id || `AST-${Math.floor(Math.random() * 900) + 100}`;

      onSuccess({
        id: data.user?.id || data.session?.user?.id,
        email: data.user?.email || data.session?.user?.email,
        full_name: finalName,
        position: finalPosition,
        badge_id: finalBadge,
        age: dbProfile.age || null,
        height_cm: dbProfile.height_cm || null,
        weight_kg: dbProfile.weight_kg || null,
        gender: dbProfile.gender || 'Male',
      });

    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 999 }}>
      <div className="edit-modal" style={{ width: 'min(400px, 100%)', position: 'relative' }}>
        <div className="modal-heading" style={{ justifyContent: 'center', textAlign: 'center' }}>
          <div>
            <span className="eyebrow" style={{ color: '#38bdf8' }}>ASTROVITALS</span>
            <h2>{isLogin ? 'Welcome Back' : 'Join the Mission'}</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="profile-form" style={{ marginTop: '20px' }}>
          
          {!isLogin && (
            <label>FULL NAME
              <div style={{ position: 'relative' }}>
                <User size={14} style={{ position: 'absolute', left: 12, top: 12, color: '#64748b' }} />
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Commander Alex" style={{ paddingLeft: '36px' }} />
              </div>
            </label>
          )}

          {!isLogin && (
            <label>POSITION
              <div style={{ position: 'relative' }}>
                <Award size={14} style={{ position: 'absolute', left: 12, top: 12, color: '#64748b' }} />
                <select 
                  required 
                  value={position} 
                  onChange={(e) => setPosition(e.target.value)} 
                  style={{ paddingLeft: '36px' }}
                >
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </label>
          )}

          <label>EMAIL ADDRESS
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: 12, top: 12, color: '#64748b' }} />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="astronaut@nasa.gov" style={{ paddingLeft: '36px' }} />
            </div>
          </label>

          <label>PASSWORD
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: 12, top: 12, color: '#64748b' }} />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ paddingLeft: '36px' }} />
            </div>
          </label>

          {error && <div style={{ color: '#fb7185', fontSize: '12px', background: 'rgba(251,113,133,0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(251,113,133,0.3)', lineHeight: 1.5 }}>{error}</div>}

          <button className="primary-button full-button" type="submit" disabled={loading}>
            {loading ? <Loader2 size={16} className="spin" /> : (isLogin ? 'Log In' : 'Create Account')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#94a3b8' }}>
          {isLogin ? "Don't have an account? " : "Already registered? "}
          <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }} style={{ color: '#38bdf8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            {isLogin ? 'Register here' : 'Login here'}
          </button>
        </div>
      </div>
    </div>
  );
}