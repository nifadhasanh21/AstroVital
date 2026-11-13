import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity, Heart, Moon, Droplet, CheckCircle2, AlertTriangle, Search,
  Settings, House, FileText, Bell, Users, Cpu, PieChart, Database,
  LogOut, Edit3, X, Save, ChevronRight, Wifi,
  Footprints, BedDouble, Timer, CalendarDays, RefreshCw, Download,
  ShieldCheck, ClipboardList, FlaskConical, Smartphone,
  CircleHelp, MoreHorizontal, ArrowUpRight, Check, Menu, Droplets, Award,
  Thermometer, Wind
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { AnimatedSpaceBG } from './components/AnimatedSpaceBG';
import { HologramBody } from './components/HologramBody';
import { CrewPage } from './components/CrewPage'; 
import heroAstronaut from './assets/hero-astronaut.png';
import heroOrbit from './assets/hero-orbit.png';
import { AuthModal } from './components/AuthModal';
import { subscribeDashboardRealtime, isSupabaseRealtimeConfigured } from './services/dashboardRealtime';

type TabName =
  | 'Overview' | 'Health Analytics' | 'Activities' | 'Daily Tasks' | 'Alerts'
  | 'Astronauts' | 'Devices' | 'Reports' | 'Research' | 'Settings';
type Task = { id: number | string; text: string; category: string; done: boolean; time?: string };
type AlertItem = { id: number | string; title: string; time: string; value: string; level: 'High' | 'Medium' | 'Low'; acknowledged?: boolean };
type TrendPoint = { time: string; HR: number; SpO2: number; Steps: number };
type ConnectionState = 'live' | 'connecting';
type MetricSet = { heartRate: number; steps: number; sleep: number; water: number; spo2: number; systolic: number; diastolic: number; temperature: number; respiration: number };

type RegisteredUser = {
  id: string;
  full_name: string;
  email: string;
  badge_id: string;
  position: string;
  healthScore: number;
  metrics: MetricSet;
};

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '/api';

export const POSITIONS = [
  'Mission Commander', 'Pilot', 'Flight Engineer', 'Mission Specialist',
  'Payload Specialist', 'Medical Officer', 'EVA Specialist',
  'Robotics Operator', 'Science Officer'
];

const demoTrends: Record<'1D' | '1W' | '1M' | '3M', TrendPoint[]> = {
  '1D': [
    { time: '00:00', HR: 68, SpO2: 99, Steps: 12 }, { time: '04:00', HR: 62, SpO2: 98, Steps: 4 },
    { time: '08:00', HR: 75, SpO2: 97, Steps: 35 }, { time: '12:00', HR: 82, SpO2: 98, Steps: 60 },
    { time: '16:00', HR: 74, SpO2: 99, Steps: 85 }, { time: '20:00', HR: 70, SpO2: 98, Steps: 84 },
  ],
  '1W': [
    { time: 'Mon', HR: 70, SpO2: 98, Steps: 81 }, { time: 'Tue', HR: 74, SpO2: 97, Steps: 85 },
    { time: 'Wed', HR: 72, SpO2: 99, Steps: 90 }, { time: 'Thu', HR: 78, SpO2: 96, Steps: 85 },
    { time: 'Fri', HR: 71, SpO2: 98, Steps: 92 }, { time: 'Sat', HR: 69, SpO2: 98, Steps: 78 },
    { time: 'Sun', HR: 73, SpO2: 99, Steps: 84 },
  ],
  '1M': [
    { time: 'W1', HR: 71, SpO2: 98, Steps: 75 }, { time: 'W2', HR: 73, SpO2: 97, Steps: 82 },
    { time: 'W3', HR: 70, SpO2: 99, Steps: 88 }, { time: 'W4', HR: 72, SpO2: 98, Steps: 84 },
  ],
  '3M': [
    { time: 'Sep', HR: 72, SpO2: 98, Steps: 80 }, { time: 'Oct', HR: 71, SpO2: 99, Steps: 83 },
    { time: 'Nov', HR: 73, SpO2: 98, Steps: 85 },
  ],
};

const initialMetrics: MetricSet = {
  heartRate: 0, steps: 0, sleep: 0, water: 0, spo2: 0,
  systolic: 0, diastolic: 0, temperature: 0, respiration: 0,
};

const initialTasks: Task[] = [
  { id: 1, text: 'Morning health check', category: 'Medical', time: '07:00', done: true },
  { id: 2, text: 'Breakfast nutrition log', category: 'Nutrition', time: '08:00', done: true },
  { id: 3, text: 'Water intake target', category: 'Nutrition', time: 'All day', done: true },
  { id: 4, text: 'Resistance exercise session', category: 'Fitness', time: '10:30', done: true },
  { id: 5, text: 'Daily step goal', category: 'Fitness', time: 'All day', done: true },
  { id: 6, text: 'Lunch / dinner log', category: 'Nutrition', time: '13:00', done: false },
  { id: 7, text: 'Mood and fatigue check', category: 'Medical', time: '18:00', done: false },
  { id: 8, text: 'Evening health review', category: 'Medical', time: '20:00', done: false },
];

const navItems = [
  { name: 'Overview' as TabName, icon: House },
  { name: 'Health Analytics' as TabName, icon: Activity },
  { name: 'Activities' as TabName, icon: Footprints },
  { name: 'Daily Tasks' as TabName, icon: ClipboardList },
  { name: 'Alerts' as TabName, icon: Bell },
  { name: 'Astronauts' as TabName, icon: Users },
  { name: 'Devices' as TabName, icon: Cpu },
  { name: 'Reports' as TabName, icon: PieChart },
  { name: 'Research' as TabName, icon: FlaskConical },
  { name: 'Settings' as TabName, icon: Settings },
];

const readStored = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

const initials = (name?: string) => {
  if (!name?.trim()) return 'AR';
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0].slice(0, 2)).toUpperCase();
};

const safeNumber = (value: unknown, fallback: number) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const calculateHealthScore = (m: MetricSet) => {
  if (m.heartRate === 0 && m.steps === 0) return 0;
  let score = 100;
  if (m.heartRate > 0) {
    if (m.heartRate < 55 || m.heartRate > 100) score -= 15;
    else if (m.heartRate < 60 || m.heartRate > 90) score -= 5;
  }
  if (m.spo2 > 0 && m.spo2 < 95) score -= 15;
  if (m.sleep > 0) {
    if (m.sleep < 6) score -= 10;
    else if (m.sleep < 7) score -= 5;
  }
  if (m.water > 0 && m.water < 1.5) score -= 5;
  if (m.steps > 0) {
    if (m.steps < 3000) score -= 10;
    else if (m.steps < 6000) score -= 5;
  }
  return Math.max(0, Math.min(100, score));
};

const getScoreText = (score: number) => {
  if (score === 0) return { text: 'No Data', color: '#94a3b8' };
  if (score >= 90) return { text: 'Excellent', color: '#34d399' };
  if (score >= 80) return { text: 'Good', color: '#38bdf8' };
  if (score >= 70) return { text: 'Fair', color: '#fbbf65' };
  return { text: 'Needs Attention', color: '#fb7185' };
};

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>;
}

function PanelHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="panel-heading">
      <div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>
      {action}
    </div>
  );
}

function StatusPill({ state }: { state: ConnectionState }) {
  const label = state === 'live' ? 'LIVE DATA' : 'CONNECTING';
  return <span className={`status-pill status-${state}`}><span className="status-dot" />{label}</span>;
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-state"><CircleHelp size={22} /><strong>{title}</strong><span>{detail}</span></div>;
}

function App() {
  const [activeTab, setActiveTabState] = useState<TabName>(() => {
    const saved = localStorage.getItem('astrovital_active_tab');
    return (saved as TabName) || 'Overview';
  });

  const [user, setUser] = useState<any>(() => readStored('astrovital_user', null));
  const [allUsers, setAllUsers] = useState<RegisteredUser[]>(() => readStored('astrovital_all_users', []));
  
  const [timeFilter, setTimeFilter] = useState<'1D' | '1W' | '1M' | '3M'>('1W');
  const [searchQuery, setSearchQuery] = useState('');
  const [metrics, setMetrics] = useState<MetricSet>(initialMetrics);
  const [trends, setTrends] = useState<TrendPoint[]>(demoTrends['1W']);
  const [tasks, setTasks] = useState<Task[]>(() => readStored('astrovital_tasks', initialTasks));
  
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Record<string, boolean>>(() => readStored('astrovital_ack_alerts', {}));
  
  const [connection, setConnection] = useState<ConnectionState>('live');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState('');
  
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState<string>('34'); 
  const [editHeight, setEditHeight] = useState<string>('180');
  const [editWeight, setEditWeight] = useState<string>('72');
  const [editGender, setEditGender] = useState('Male');
  const [editPosition, setEditPosition] = useState(POSITIONS[0]);

  const [deviceSyncing, setDeviceSyncing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(() => readStored('astrovital_auto_refresh', true));
  const [alertNotifications, setAlertNotifications] = useState<boolean>(() => readStored('astrovital_alert_notifications', true));
  const [showWeeklySummary, setShowWeeklySummary] = useState<boolean>(() => readStored('astrovital_show_weekly_summary', true));

  const currentHealthScore = calculateHealthScore(metrics);
  const scoreInfo = getScoreText(currentHealthScore);

  const setTab = (tab: TabName) => { 
    setActiveTabState(tab); 
    localStorage.setItem('astrovital_active_tab', tab);
    setMobileNavOpen(false); 
    setSearchQuery(''); 
  };

  const activeAlerts = useMemo(() => {
    const list: AlertItem[] = [];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (metrics.heartRate > 100) list.push({ id: 'hr-high', title: 'Elevated heart rate', time: timeStr, value: `${metrics.heartRate} BPM`, level: 'High' });
    if (metrics.heartRate > 0 && metrics.heartRate < 55) list.push({ id: 'hr-low', title: 'Low heart rate', time: timeStr, value: `${metrics.heartRate} BPM`, level: 'Medium' });
    if (metrics.spo2 > 0 && metrics.spo2 < 95) list.push({ id: 'spo2-low', title: 'Low blood oxygen', time: timeStr, value: `${metrics.spo2}%`, level: 'High' });
    if (metrics.temperature > 38) list.push({ id: 'temp-high', title: 'High body temperature', time: timeStr, value: `${metrics.temperature.toFixed(1)}°C`, level: 'High' });
    if (metrics.temperature > 0 && metrics.temperature < 35) list.push({ id: 'temp-low', title: 'Low body temperature', time: timeStr, value: `${metrics.temperature.toFixed(1)}°C`, level: 'Medium' });
    if (metrics.systolic > 140 || metrics.diastolic > 90) list.push({ id: 'bp-high', title: 'High blood pressure', time: timeStr, value: `${metrics.systolic}/${metrics.diastolic}`, level: 'High' });
    if (metrics.systolic > 0 && (metrics.systolic < 90 || metrics.diastolic < 60)) list.push({ id: 'bp-low', title: 'Low blood pressure', time: timeStr, value: `${metrics.systolic}/${metrics.diastolic}`, level: 'Medium' });
    if (metrics.respiration > 24) list.push({ id: 'resp-high', title: 'High respiratory rate', time: timeStr, value: `${metrics.respiration} br/min`, level: 'High' });
    if (metrics.respiration > 0 && metrics.respiration < 12) list.push({ id: 'resp-low', title: 'Low respiratory rate', time: timeStr, value: `${metrics.respiration} br/min`, level: 'Medium' });
    if (metrics.sleep > 0 && metrics.sleep < 6) list.push({ id: 'sleep-low', title: 'Low sleep duration', time: timeStr, value: `${metrics.sleep.toFixed(1)} hours`, level: 'Medium' });
    if (metrics.water > 0 && metrics.water < 1.5) list.push({ id: 'water-low', title: 'Low hydration', time: timeStr, value: `${metrics.water.toFixed(1)} L`, level: 'Low' });
    if (metrics.steps > 0 && metrics.steps < 3000) list.push({ id: 'steps-low', title: 'Low activity level', time: timeStr, value: `${metrics.steps} steps`, level: 'Low' });

    return list.map(a => ({ ...a, acknowledged: acknowledgedAlerts[a.id] || false }));
  }, [metrics, acknowledgedAlerts]);

  const pendingAlerts = activeAlerts.filter(a => !a.acknowledged);

  useEffect(() => {
    const activeIds = activeAlerts.map(a => a.id);
    setAcknowledgedAlerts(prev => {
      const next = { ...prev };
      let changed = false;
      for (const id in next) {
        if (!activeIds.includes(id)) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [activeAlerts]);

  useEffect(() => { localStorage.setItem('astrovital_ack_alerts', JSON.stringify(acknowledgedAlerts)); }, [acknowledgedAlerts]);

  useEffect(() => {
    if (user) {
      setEditName(user.full_name || '');
      setEditAge(user.age && user.age > 0 ? String(user.age) : '34');
      setEditHeight(user.height_cm && user.height_cm > 0 ? String(user.height_cm) : '180');
      setEditWeight(user.weight_kg && user.weight_kg > 0 ? String(user.weight_kg) : '72');
      setEditGender(user.gender || 'Male');
      setEditPosition(user.position || POSITIONS[0]);

      if (!user.position) {
        setEditModalOpen(true);
      }
    }
  }, [user]);

  useEffect(() => {
    if (allUsers.length > 0) {
      localStorage.setItem('astrovital_all_users', JSON.stringify(allUsers));
    }
  }, [allUsers]);

  useEffect(() => { localStorage.setItem('astrovital_tasks', JSON.stringify(tasks)); }, [tasks]);

  const postAction = async (path: string, body: unknown) => {
    if (!API_BASE) return false;
    try {
      const token = localStorage.getItem('astrovital_token');
      const response = await fetch(`${API_BASE}${path}`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.error || `Request failed: ${response.status}`;
        console.error(`Backend Error on ${path}:`, msg);
        throw new Error(msg);
      }
      return true;
    } catch (error: any) {
      console.warn(`AstroVitals action ${path} failed:`, error.message);
      // Task completion e error toast na dekhai, silently ignore kori
      if (path !== '/tasks/complete') {
         setToast(error.message);
      }
      return false;
    }
  };

  // NEW: Fetch all astronauts globally from DB
  const fetchAllUsers = useCallback(async () => {
    if (!API_BASE) return;
    try {
      const token = localStorage.getItem('astrovital_token');
      const response = await fetch(`${API_BASE}/auth/astronauts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.users) {
          // Merge current user's live metrics into the global list
          const formattedUsers = json.users.map((u: any) => {
            const isCurrentUser = u.auth_id === user?.id || u.id === user?.id;
            return {
              id: u.auth_id || u.id,
              full_name: u.full_name || 'Astronaut',
              email: isCurrentUser && user?.email ? user.email : (u.email || 'unknown@astrovitals.space'),
              badge_id: u.badge_id || `AST-${Math.floor(Math.random() * 900) + 100}`,
              position: u.position || 'Unassigned',
              healthScore: isCurrentUser ? currentHealthScore : (u.health_score || 100),
              metrics: isCurrentUser ? metrics : initialMetrics
            };
          });
          setAllUsers(formattedUsers);
        }
      }
    } catch (error) {
      console.warn('Failed to fetch global astronauts', error);
    }
  }, [user, metrics, currentHealthScore]);

  const refreshDashboard = useCallback(async (silent = false) => {
    if (!API_BASE) return;
    if (!silent) setIsRefreshing(true);
    try {
      const token = localStorage.getItem('astrovital_token');
      const response = await fetch(`${API_BASE}/dashboard?range=${timeFilter}`, {
        method: 'GET',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      });
      
      if (!response.ok) throw new Error(`Dashboard API returned ${response.status}`);
      
      const json = await response.json();
      const payload = json?.data ?? json;

      console.log("📡 Data fetched from backend:", payload);

      if (payload.metrics) {
        setMetrics(current => ({
          heartRate: payload.metrics.heartRate !== undefined ? Number(payload.metrics.heartRate) : current.heartRate,
          steps: payload.metrics.steps !== undefined ? Number(payload.metrics.steps) : current.steps,
          sleep: payload.metrics.sleep !== undefined ? Number(payload.metrics.sleep) : current.sleep,
          water: payload.metrics.water !== undefined ? Number(payload.metrics.water) : current.water,
          spo2: payload.metrics.spo2 !== undefined ? Number(payload.metrics.spo2) : current.spo2,
          systolic: payload.metrics.systolic !== undefined ? Number(payload.metrics.systolic) : current.systolic,
          diastolic: payload.metrics.diastolic !== undefined ? Number(payload.metrics.diastolic) : current.diastolic,
          temperature: payload.metrics.temperature !== undefined ? Number(payload.metrics.temperature) : current.temperature,
          respiration: payload.metrics.respiration !== undefined ? Number(payload.metrics.respiration) : current.respiration,
        }));
      }

      if (payload.trends && Array.isArray(payload.trends) && payload.trends.length > 0) {
        setTrends(payload.trends.map((row: any) => ({
          time: String(row.time || ''),
          HR: safeNumber(row.HR, 0),
          SpO2: safeNumber(row.SpO2, 0),
          Steps: safeNumber(row.Steps, 0),
        })));
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.warn('AstroVitals dashboard refresh failed.', error);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  }, [timeFilter]);

  const simulateLiveData = async () => {
    setToast('Fetching real data...');
    await refreshDashboard(false);
    await fetchAllUsers();
    setToast('Real data loaded successfully!');
  };

  useEffect(() => {
    void refreshDashboard(true);
    void fetchAllUsers();

    const pollId = autoRefresh ? window.setInterval(() => {
      void refreshDashboard(true);
      void fetchAllUsers();
    }, 10000) : undefined;
    
    const stopRealtime = subscribeDashboardRealtime(() => {
        console.log("🔔 Realtime event received!");
        void refreshDashboard(true);
        void fetchAllUsers();
    });

    return () => {
      if (pollId !== undefined) window.clearInterval(pollId);
      stopRealtime();
    };
  }, [refreshDashboard, autoRefresh, fetchAllUsers]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const completedCount = tasks.filter((task) => task.done).length;
  const progressPercent = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  const filteredTasks = useMemo(() => tasks.filter((task) =>
    `${task.text} ${task.category}`.toLowerCase().includes(searchQuery.toLowerCase())), [tasks, searchQuery]);
  
  const filteredAlerts = useMemo(() => activeAlerts.filter((alert) =>
    `${alert.title} ${alert.value} ${alert.level}`.toLowerCase().includes(searchQuery.toLowerCase())), [activeAlerts, searchQuery]);

  const toggleTask = async (id: Task['id']) => {
    const target = tasks.find((task) => task.id === id);
    if (!target) return;
    const nextDone = !target.done;
    setTasks((current) => current.map((task) => task.id === id ? { ...task, done: nextDone } : task));
    if (API_BASE) {
      await postAction('/tasks/complete', { task_id: id, completed: nextDone });
    }
  };

  const acknowledgeAlert = async (id: string) => {
    setAcknowledgedAlerts(prev => ({ ...prev, [id]: true }));
    setToast('Alert acknowledged');
  };

  const acknowledgeAllAlerts = () => {
    const next = { ...acknowledgedAlerts };
    activeAlerts.forEach(a => next[a.id] = true);
    setAcknowledgedAlerts(next);
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const uniqueId = user?.id;
    if (!uniqueId) {
      setToast('Error: User ID not found. Please login again.');
      return;
    }
    
    const payload = { 
      id: uniqueId, 
      full_name: editName.trim() || 'Astronaut', 
      age: Number(editAge) || 34, 
      height_cm: Number(editHeight) || 180, 
      weight_kg: Number(editWeight) || 72, 
      gender: editGender, 
      position: editPosition 
    };

    const updatedUser = { ...user, ...payload };
    setUser(updatedUser);
    localStorage.setItem('astrovital_user', JSON.stringify(updatedUser));
    setEditModalOpen(false);
    setProfileMenuOpen(false);
    
    const success = await postAction('/auth/profile', payload);
    if (success) {
      setToast('Profile Updated Successfully');
      void fetchAllUsers(); // Refresh the astronaut list
    }
  };

  const logout = () => {
    localStorage.removeItem('astrovital_user');
    localStorage.removeItem('astrovital_token');
    setUser(null);
    setProfileMenuOpen(false);
  };

  const syncDevice = async () => {
    setDeviceSyncing(true);
    await simulateLiveData(); 
    setDeviceSyncing(false);
  };

  const exportCsv = () => {
    const rows = [['Metric', 'Value', 'Unit'], ['Heart rate', metrics.heartRate, 'BPM'], ['Steps', metrics.steps, 'steps'], ['Sleep', metrics.sleep, 'hours'], ['Water', metrics.water, 'L'], ['SpO2', metrics.spo2, '%'], ['Health Score', currentHealthScore, 'pts']];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.href = url;
    link.download = `astrovitals-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setToast('CSV report exported');
  };

  const displayName = user?.full_name || 'Astronaut';
  const profileAge = user?.age || 34;
  const profileHeight = user?.height_cm || 180;
  const profileWeight = user?.weight_kg || 72;
  const profilePosition = user?.position || 'Mission Commander';

  const metricCards = [
    { title: 'Heart Rate', value: String(metrics.heartRate), unit: 'BPM', icon: Heart, tint: 'rose', delta: 'Live pulse' },
    { title: 'Daily Steps', value: metrics.steps.toLocaleString(), unit: 'steps', icon: Footprints, tint: 'cyan', delta: 'Activity today' },
    { title: 'Sleep Duration', value: metrics.sleep.toFixed(1), unit: 'hours', icon: Moon, tint: 'violet', delta: 'Last sleep cycle' },
    { title: 'Water Intake', value: metrics.water.toFixed(1), unit: 'litres', icon: Droplet, tint: 'blue', delta: 'Daily hydration' },
  ];

  const secondaryMetricCards = [
    { title: 'Blood Oxygen', value: String(metrics.spo2), unit: '%', icon: Droplets, tint: 'cyan', delta: 'SpO2 level' },
    { title: 'Body Temperature', value: metrics.temperature.toFixed(1), unit: '°C', icon: Thermometer, tint: 'rose', delta: 'Core temp' },
    { title: 'Blood Pressure', value: (metrics.systolic > 0 && metrics.diastolic > 0) ? `${metrics.systolic}/${metrics.diastolic}` : '0/0', unit: 'mmHg', icon: Activity, tint: 'violet', delta: 'Sys/Dia' },
    { title: 'Respiratory Rate', value: String(metrics.respiration), unit: 'br/min', icon: Wind, tint: 'blue', delta: 'Breaths per min' },
  ];

  return (
    <div className="astro-app">
      <AnimatedSpaceBG />
      {!user && (
        <AuthModal 
          onSuccess={(newUser) => {
            const normalizedUser = {
              ...newUser,
              full_name: newUser.full_name || 'Astronaut',
              id: newUser.id || `usr_${Date.now()}`,
              badge_id: newUser.badge_id || `AST-${Math.floor(Math.random() * 900) + 100}`,
              position: newUser.position || '' 
            };
            setUser(normalizedUser);
            localStorage.setItem('astrovital_user', JSON.stringify(normalizedUser));
            void fetchAllUsers();
          }} 
        />
      )}

      <div className="app-shell">
        <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
          <div>
            <div className="brand-lockup">
              <div className="brand-mark"><Activity size={23} /></div>
              <div><h1>AstroVitals</h1><p>MONITOR · PROTECT · THRIVE</p></div>
              <button className="mobile-close icon-button" onClick={() => setMobileNavOpen(false)} aria-label="Close menu"><X size={18} /></button>
            </div>
            <div className="mission-label">MISSION CONTROL <span>01</span></div>
            <nav className="side-nav" aria-label="Main navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.name;
                return <button key={item.name} onClick={() => setTab(item.name)} className={`nav-item ${active ? 'active' : ''}`}>
                  <Icon size={17} strokeWidth={1.8} /><span>{item.name}</span>
                  {item.name === 'Alerts' && alertNotifications && pendingAlerts.length > 0 && <b className="nav-badge">{pendingAlerts.length}</b>}
                  {active && <span className="nav-active-line" />}
                </button>;
              })}
            </nav>
          </div>
          <div className="sidebar-footer">
            <div className="sidebar-footer-brand"><span className="tiny-live-dot" /> <span>ASTROVITALS</span></div>
            <div className="sidebar-version">CREW HEALTH DASHBOARD</div>
          </div>
        </aside>

        {mobileNavOpen && <button className="mobile-backdrop" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation" />}

        <main className="main-area">
          <header className="topbar">
            <div className="topbar-left">
              <button className="mobile-menu icon-button" onClick={() => setMobileNavOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
              
              <div className="search-box">
                <Search size={16} />
                <input 
                  value={searchQuery} 
                  onChange={(event) => setSearchQuery(event.target.value)} 
                  placeholder="Search tasks, alerts, metrics..." 
                />
                
                {searchQuery.length > 0 && (
                  <div className="search-results-dropdown">
                    {filteredTasks.length > 0 && (
                      <div className="search-result-section">
                        <div className="search-result-title">Tasks</div>
                        {filteredTasks.map(task => (
                          <div key={task.id} className="search-result-item" onClick={() => { setTab('Daily Tasks'); setSearchQuery(''); }}>
                            <CheckCircle2 size={14} />
                            <span>{task.text}</span>
                            <small>{task.done ? 'Done' : 'Pending'}</small>
                          </div>
                        ))}
                      </div>
                    )}
                    {filteredAlerts.length > 0 && (
                      <div className="search-result-section">
                        <div className="search-result-title">Alerts</div>
                        {filteredAlerts.map(alert => (
                          <div key={alert.id} className="search-result-item" onClick={() => { setTab('Alerts'); setSearchQuery(''); }}>
                            <AlertTriangle size={14} style={{ color: alert.level === 'High' ? '#fb7185' : '#fbbf65' }} />
                            <span>{alert.title}</span>
                            <small>{alert.value}</small>
                          </div>
                        ))}
                      </div>
                    )}
                    {filteredTasks.length === 0 && filteredAlerts.length === 0 && (
                      <div className="search-empty">No results found for "{searchQuery}"</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="topbar-right">
              <StatusPill state={connection} />
              <div className="topbar-divider" />
              <div className="utc-clock"><CalendarDays size={15} /><span>{new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false })} UTC</span></div>
              
              <button className="ghost-button" onClick={simulateLiveData} style={{ marginRight: '10px', fontSize: '12px' }}>
                <Database size={14} style={{ marginRight: '5px' }} /> See Real Data
              </button>

              <button className="refresh-button" onClick={() => void refreshDashboard()} disabled={isRefreshing} title="Refresh dashboard"><RefreshCw size={15} className={isRefreshing ? 'spin' : ''} /></button>
              <div className="profile-anchor">
                <button className="avatar-button" onClick={() => setProfileMenuOpen((open) => !open)} aria-label="Open astronaut profile menu">{initials(user?.full_name)}</button>
                {profileMenuOpen && <div className="profile-menu">
                  <div className="profile-menu-head"><strong>{displayName}</strong><span>{profilePosition}</span><small>{user?.badge_id || 'AST-001'} · ACTIVE CREW</small></div>
                  <button onClick={() => { setEditModalOpen(true); setProfileMenuOpen(false); }}><Edit3 size={15} /> Edit profile</button>
                  <button className="logout-action" onClick={logout}><LogOut size={15} /> Sign out</button>
                </div>}
              </div>
            </div>
          </header>

          {editModalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditModalOpen(false); }}>
            <div className="edit-modal">
              <div className="modal-heading"><div><span className="eyebrow">CREW RECORD</span><h2>Edit astronaut profile</h2></div><button className="icon-button" onClick={() => setEditModalOpen(false)}><X size={18} /></button></div>
              <form onSubmit={saveProfile} className="profile-form">
                <label>FULL NAME<input required value={editName} onChange={(event) => setEditName(event.target.value)} /></label>
                <label>POSITION<select required value={editPosition} onChange={(event) => setEditPosition(event.target.value)}>{POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}</select></label>
                <div className="form-grid">
                  <label>AGE<input type="number" min="18" max="100" value={editAge} onChange={(event) => setEditAge(event.target.value)} /></label>
                  <label>GENDER<select value={editGender} onChange={(event) => setEditGender(event.target.value)}><option>Male</option><option>Female</option><option>Other</option></select></label>
                </div>
                <div className="form-grid">
                  <label>HEIGHT · CM<input type="number" min="100" max="250" value={editHeight} onChange={(event) => setEditHeight(event.target.value)} /></label>
                  <label>WEIGHT · KG<input type="number" min="30" max="250" value={editWeight} onChange={(event) => setEditWeight(event.target.value)} /></label>
                </div>
                <button className="primary-button full-button" type="submit"><Save size={16} /> Save astronaut data</button>
              </form>
            </div>
          </div>}

          <div className="page-content">
            {activeTab === 'Overview' && <div className="page-stack animate-fadeIn">
              <section className="hero-card">
                <div className="hero-copy">
                  <span className="eyebrow"><span className="tiny-live-dot" /> CREW HEALTH OVERVIEW</span>
                  <h2>Welcome back,<br /><em>{displayName.split(' ')[0]}</em>.</h2>
                  <p>A clear view of your health, daily activity and mission readiness.</p>
                  
                  <div className="hero-score-row">
                     <div className="hero-score-badge" style={{ borderColor: scoreInfo.color, color: scoreInfo.color, background: `${scoreInfo.color}15` }}>
                        <Award size={16} /> Health Score: {currentHealthScore}/100 ({scoreInfo.text})
                     </div>
                     <span className="hero-updated">Updated {lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'}</span>
                  </div>
                </div>
                
                <div className="hero-astronaut-art" style={{ backgroundImage: `url(${heroAstronaut})` }} />
                <div className="hero-space-art" style={{ backgroundImage: `url(${heroOrbit})` }}><div className="hero-visual-caption"><span>ASTROVITALS</span><b>CREW WELLNESS</b></div></div>
              </section>

              <div className="metric-grid">
                {metricCards.map((metric) => { const Icon = metric.icon; return <article className={`metric-card metric-${metric.tint}`} key={metric.title}>
                  <div className="metric-card-top"><span className="metric-icon"><Icon size={19} /></span><span className="metric-kicker">{metric.title}</span><MoreHorizontal size={17} className="muted-icon" /></div>
                  <div className="metric-value">{metric.value}<small>{metric.unit}</small></div><div className="metric-bottom"><span>{metric.delta}</span><span className="metric-sparkline"><i /><i /><i /><i /><i /><i /><i /></span></div>
                </article>; })}
              </div>

              <div className="metric-grid" style={{ marginTop: '16px' }}>
                {secondaryMetricCards.map((metric) => { const Icon = metric.icon; return <article className={`metric-card metric-${metric.tint}`} key={metric.title}>
                  <div className="metric-card-top"><span className="metric-icon"><Icon size={19} /></span><span className="metric-kicker">{metric.title}</span><MoreHorizontal size={17} className="muted-icon" /></div>
                  <div className="metric-value">{metric.value}<small>{metric.unit}</small></div><div className="metric-bottom"><span>{metric.delta}</span><span className="metric-sparkline"><i /><i /><i /><i /><i /><i /><i /></span></div>
                </article>; })}
              </div>

              <div className="overview-grid">
                <Panel className="trend-panel"><PanelHeading title="Health telemetry" subtitle="Physiological readings across the selected period" action={<div className="range-switch">{(['1D', '1W', '1M', '3M'] as const).map((range) => <button key={range} className={timeFilter === range ? 'selected' : ''} onClick={() => { setTimeFilter(range); }}>{range}</button>)}</div>} />
                  <div className="chart-legend"><span><i className="legend-dot dot-rose" /> Heart rate</span><span><i className="legend-dot dot-cyan" /> SpO₂</span><span><i className="legend-dot dot-green" /> Activity index</span></div>
                  <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trends} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}><defs><linearGradient id="hrFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fb7185" stopOpacity={0.25} /><stop offset="95%" stopColor="#fb7185" stopOpacity={0} /></linearGradient><linearGradient id="spoFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38bdf8" stopOpacity={0.2} /><stop offset="95%" stopColor="#38bdf8" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#17314a" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="time" stroke="#7891a9" tickLine={false} axisLine={false} fontSize={10} /><YAxis stroke="#7891a9" tickLine={false} axisLine={false} fontSize={10} domain={[0, 120]} /><Tooltip contentStyle={{ background: '#071426', border: '1px solid #1e4968', borderRadius: 12, color: '#e7f4ff' }} /><Area type="monotone" dataKey="HR" name="Heart rate" stroke="#fb7185" strokeWidth={2.2} fill="url(#hrFill)" /><Area type="monotone" dataKey="SpO2" name="SpO₂" stroke="#38bdf8" strokeWidth={2.2} fill="url(#spoFill)" /><Line type="monotone" dataKey="Steps" name="Activity index" stroke="#34d399" strokeWidth={2} dot={false} /></AreaChart></ResponsiveContainer></div>
                  <div className="chart-footnote"><span><span className="tiny-live-dot" /> Streaming from mission data service</span><span>Source-aware readings · UTC</span></div>
                </Panel>

                <Panel className="progress-panel"><PanelHeading title="Daily mission progress" subtitle="Crew checklist completion" action={<span className="mini-date">TODAY</span>} />
                  <div className="progress-content"><div className="progress-ring" style={{ background: `conic-gradient(#25d9d0 ${progressPercent * 3.6}deg, #17374b 0deg)` }}><div><strong>{progressPercent}%</strong><span>COMPLETE</span></div></div><div className="progress-task-list">{tasks.slice(0, 5).map((task) => <button key={task.id} onClick={() => void toggleTask(task.id)} className={`progress-task ${task.done ? 'task-done' : ''}`}><CheckCircle2 size={15} /><span>{task.text}</span></button>)}</div></div>
                  <button className="text-link" onClick={() => setTab('Daily Tasks')}>View all daily tasks <ChevronRight size={14} /></button>
                </Panel>

                <Panel className="alerts-panel"><PanelHeading title="Health alerts" subtitle={`${pendingAlerts.length} require attention`} action={<button className="text-link compact-link" onClick={() => setTab('Alerts')}>View all <ArrowUpRight size={13} /></button>} />
                  <div className="alert-preview-list">{pendingAlerts.slice(0, 3).map((alert) => <div className="alert-preview" key={alert.id}><span className={`alert-icon alert-${alert.level.toLowerCase()}`}><AlertTriangle size={16} /></span><div className="alert-copy"><strong>{alert.title}</strong><span>{alert.value} · {alert.time}</span></div><span className={`severity severity-${alert.level.toLowerCase()}`}>{alert.level}</span></div>)}{pendingAlerts.length === 0 && <EmptyState title="All clear" detail="No unacknowledged alerts." />}</div>
                </Panel>
              </div>

              <div className="bottom-grid">
                <Panel className="crew-panel"><PanelHeading title="Astronaut profile" action={<button className="icon-button subtle-icon" onClick={() => setEditModalOpen(true)}><Edit3 size={15} /></button>} /><div className="crew-profile"><div className="crew-avatar">{initials(user?.full_name)}</div><div><h4>{displayName}</h4><span className="crew-id">{profilePosition} · {user?.badge_id || 'AST-001'}</span><p>Age {profileAge} <i /> Height {profileHeight} cm</p><p>Weight {profileWeight} kg <i /> {user?.gender || 'Male'}</p></div></div><div className="crew-footer"><span><span className="tiny-live-dot" /> Crew member active</span><span>MISSION PROFILE</span></div></Panel>
                
                <Panel className="body-panel"><PanelHeading title="Body metrics" subtitle="Latest recorded measurements" /><div className="body-metrics-layout"><HologramBody /><div className="body-metric-list"><div><span className="body-metric-icon"><Heart size={14} /></span><span>Blood pressure</span><strong>{metrics.systolic}/{metrics.diastolic}<small> mmHg</small></strong></div><div><span className="body-metric-icon"><Timer size={14} /></span><span>Temperature</span><strong>{metrics.temperature.toFixed(1)}<small> °C</small></strong></div><div><span className="body-metric-icon"><Activity size={14} /></span><span>Respiratory rate</span><strong>{metrics.respiration}<small> br/min</small></strong></div><div><span className="body-metric-icon"><Droplets size={14} /></span><span>Blood oxygen</span><strong>{metrics.spo2}<small>%</small></strong></div></div></div></Panel>
                
                <Panel className="health-overview-panel">
                  <PanelHeading title="Health Overview" subtitle="Based on available health indicators" action={<span className="mini-date">LIVE</span>} />
                  <div className="health-overview-content">
                    <div className="health-overview-left">
                      <div className="health-ring-large" style={{ background: `conic-gradient(${scoreInfo.color} ${currentHealthScore * 3.6}deg, #17374b 0deg)` }}>
                        <div className="health-ring-inner">
                          <strong>{currentHealthScore}%</strong>
                          <span>HEALTH SCORE</span>
                        </div>
                      </div>
                      <div className="health-score-label" style={{ color: scoreInfo.color }}>{scoreInfo.text}</div>
                      <div className="health-score-sub">Illustrative score</div>
                    </div>
                    <div className="health-overview-right">
                      <div className="health-stat-row">
                        <div className="health-stat-text">
                          <span>Overall Score</span>
                          <strong>{currentHealthScore}/100</strong>
                        </div>
                      </div>
                      <div className="health-stat-row">
                        <div className="health-stat-text">
                          <span>Data completeness</span>
                          <strong>92%</strong>
                        </div>
                        <small>Available readings received</small>
                      </div>
                      <div className="health-stat-row">
                        <div className="health-stat-text">
                          <span>Last updated</span>
                          <strong>{lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:30 PM'}</strong>
                        </div>
                      </div>
                      <div className="hydration-bar-wrapper">
                        <div className="hydration-bar-labels">
                          <span><Droplet size={12} /> Hydration</span>
                          <strong>{metrics.water.toFixed(1)}L / 3.0L</strong>
                        </div>
                        <div className="hydration-bar-track">
                          <span style={{ width: `${Math.min(100, (metrics.water / 3.0) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Panel>

              </div>
              <div className="disclaimer-note"><ShieldCheck size={14} /><span>Health indicators are for monitoring and research demonstration only. They are not medical diagnoses or emergency guidance.</span></div>
            </div>}

            {activeTab === 'Astronauts' && (
              <CrewPage 
                displayName={displayName}
                badgeId={user?.badge_id || 'AST-001'}
                userId={user?.id || 'ast-001'}
                userEmail={user?.email || 'unknown@astrovitals.space'}
                ownReadiness={currentHealthScore}
                allUsers={allUsers} 
                onViewOwn={() => setTab('Health Analytics')}
                onEditProfile={() => setEditModalOpen(true)}
              />
            )}

            {activeTab === 'Health Analytics' && <div className="page-stack animate-fadeIn"><PageTitle eyebrow="PHYSIOLOGICAL MONITORING" title="Health analytics" subtitle="Explore vital-sign trends and the latest recorded body measurements." action={<StatusPill state={connection} />} /><div className="metric-grid compact-metrics">{metricCards.map((metric) => { const Icon = metric.icon; return <article className={`metric-card metric-${metric.tint}`} key={metric.title}><div className="metric-card-top"><span className="metric-icon"><Icon size={18} /></span><span className="metric-kicker">{metric.title}</span></div><div className="metric-value">{metric.value}<small>{metric.unit}</small></div><div className="metric-bottom"><span>{metric.delta}</span></div></article>; })}</div><Panel><PanelHeading title="Multi-signal health trend" subtitle="Compare heart rate, blood oxygen and activity index" action={<div className="range-switch">{(['1D', '1W', '1M', '3M'] as const).map((range) => <button key={range} className={timeFilter === range ? 'selected' : ''} onClick={() => { setTimeFilter(range); }}>{range}</button>)}</div>} /><div className="large-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={trends} margin={{ top: 15, right: 14, left: 0, bottom: 4 }}><CartesianGrid stroke="#17314a" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="time" stroke="#7891a9" tickLine={false} axisLine={false} /><YAxis stroke="#7891a9" tickLine={false} axisLine={false} /><Tooltip contentStyle={{ background: '#071426', border: '1px solid #1e4968', borderRadius: 12 }} /><Line type="monotone" dataKey="HR" name="Heart rate (BPM)" stroke="#fb7185" strokeWidth={2.5} dot={{ r: 3 }} /><Line type="monotone" dataKey="SpO2" name="SpO₂ (%)" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 3 }} /><Line type="monotone" dataKey="Steps" name="Activity index" stroke="#34d399" strokeWidth={2.5} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div></Panel><div className="two-column-panels"><Panel><PanelHeading title="Latest body measurements" /><div className="measurement-grid">{[['Blood pressure', `${metrics.systolic}/${metrics.diastolic}`, 'mmHg'], ['SpO₂', String(metrics.spo2), '%'], ['Temperature', metrics.temperature.toFixed(1), '°C'], ['Respiratory rate', String(metrics.respiration), 'breaths/min']].map(([label, value, unit]) => <div className="measurement-tile" key={label}><span>{label}</span><strong>{value}<small>{unit}</small></strong></div>)}</div></Panel><Panel><PanelHeading title="Data quality & provenance" /><div className="source-list"><div><span className="source-dot source-watch" /><div><strong>Wearable telemetry</strong><span>Device-derived · timestamp required</span></div><b>Device</b></div><div><span className="source-dot source-manual" /><div><strong>Manual check-in</strong><span>User-entered · review recommended</span></div><b>Manual</b></div></div></Panel></div></div>}

            {activeTab === 'Activities' && <div className="page-stack animate-fadeIn"><PageTitle eyebrow="DAILY MOVEMENT" title="Activities" subtitle="Review movement, hydration, sleep and exercise activity." /><div className="activity-summary-grid"><SummaryTile icon={Footprints} label="Steps today" value={metrics.steps.toLocaleString()} meta="Daily movement" /><SummaryTile icon={BedDouble} label="Sleep duration" value={`${metrics.sleep.toFixed(1)} h`} meta="Last sleep cycle" /><SummaryTile icon={Droplet} label="Water intake" value={`${metrics.water.toFixed(1)} L`} meta="Hydration log" /><SummaryTile icon={Timer} label="Exercise" value="42 min" meta="Physical training" /></div><Panel><PanelHeading title="Activity across the week" subtitle="Daily activity index" /><div className="large-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={demoTrends['1W']}><CartesianGrid stroke="#17314a" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="time" stroke="#7891a9" axisLine={false} tickLine={false} /><YAxis stroke="#7891a9" axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: '#071426', border: '1px solid #1e4968', borderRadius: 12 }} /><Bar dataKey="Steps" name="Activity index" fill="#28c8d7" radius={[7, 7, 0, 0]} /></BarChart></ResponsiveContainer></div></Panel><Panel><PanelHeading title="Activity log" subtitle="Daily records" /><div className="table-wrap"><table><thead><tr><th>ACTIVITY</th><th>VALUE</th><th>RECORDED</th><th>SOURCE</th></tr></thead><tbody><tr><td>Steps</td><td>{metrics.steps.toLocaleString()}</td><td>Today</td><td><span className="table-tag">Wearable</span></td></tr><tr><td>Sleep</td><td>{metrics.sleep.toFixed(1)} hours</td><td>Last cycle</td><td><span className="table-tag">Wearable</span></td></tr><tr><td>Water intake</td><td>{metrics.water.toFixed(1)} litres</td><td>Today</td><td><span className="table-tag">Manual</span></td></tr><tr><td>Exercise</td><td>42 minutes</td><td>Today</td><td><span className="table-tag">User check-in</span></td></tr></tbody></table></div></Panel></div>}

            {activeTab === 'Daily Tasks' && <div className="page-stack animate-fadeIn"><PageTitle eyebrow="CREW ROUTINE" title="Daily mission checklist" subtitle="Track the astronaut's daily self-check and mission tasks." action={<span className="mini-date">{completedCount} / {tasks.length} COMPLETE</span>} /><Panel><div className="task-summary-row"><div><span className="eyebrow">DAILY COMPLETION</span><h2>{progressPercent}% <small>completed</small></h2></div><div className="task-progress-track"><span style={{ width: `${progressPercent}%` }} /></div></div><div className="task-groups">{['Medical', 'Nutrition', 'Fitness', 'General'].map((category) => { const group = filteredTasks.filter((task) => task.category === category); if (!group.length) return null; return <div className="task-group" key={category}><div className="task-group-heading"><strong>{category}</strong><span>{group.filter((task) => task.done).length}/{group.length} done</span></div>{group.map((task) => <button key={task.id} className={`task-row ${task.done ? 'complete' : ''}`} onClick={() => void toggleTask(task.id)}><span className="task-check">{task.done && <Check size={14} />}</span><span className="task-row-copy"><strong>{task.text}</strong><small>{task.category} · {task.time || 'Scheduled today'}</small></span><span className={`task-state ${task.done ? 'state-done' : ''}`}>{task.done ? 'Completed' : 'Pending'}</span></button>)}</div>; })}{filteredTasks.length === 0 && <EmptyState title="No matching tasks" detail="Try another search term." />}</div></Panel><div className="disclaimer-note"><CircleHelp size={14} /><span>Checklist items are configurable tasks. Validate astronaut-specific routines with the mission and medical teams before operational use.</span></div></div>}

            {activeTab === 'Alerts' && <div className="page-stack animate-fadeIn"><PageTitle eyebrow="MISSION SAFETY WORKFLOW" title="Health alerts" subtitle="Review, acknowledge and track monitoring notifications." action={<span className="severity severity-high">{pendingAlerts.length} OPEN</span>} /><Panel><PanelHeading title="Alert inbox" subtitle="Search and acknowledge current notifications" action={<button className="ghost-button" onClick={acknowledgeAllAlerts}>Acknowledge all</button>} />{filteredAlerts.length ? <div className="alert-inbox">{filteredAlerts.map((alert) => <div className={`alert-row ${alert.acknowledged ? 'alert-acknowledged' : ''}`} key={alert.id}><span className={`alert-icon alert-${alert.level.toLowerCase()}`}><AlertTriangle size={17} /></span><div className="alert-main"><div><strong>{alert.title}</strong><span className={`severity severity-${alert.level.toLowerCase()}`}>{alert.level}</span></div><p>{alert.value} · {alert.time}</p><small>{alert.acknowledged ? 'Acknowledged by dashboard user' : 'Requires review · Monitoring notification only'}</small></div>{!alert.acknowledged && <button className="ack-button" onClick={() => void acknowledgeAlert(alert.id)}>Acknowledge</button>}</div>)}</div> : <EmptyState title="No alerts found" detail="There are no notifications matching your search." />}</Panel><div className="disclaimer-note"><ShieldCheck size={14} /><span>Alerts are rule-based monitoring indicators, not clinical diagnoses. Thresholds must be reviewed and configured by qualified medical personnel.</span></div></div>}

            {activeTab === 'Devices' && <div className="page-stack animate-fadeIn"><PageTitle eyebrow="WEARABLE CONNECTIVITY" title="Device management" subtitle="Monitor data sources, synchronization and device health." action={<button className="primary-button" onClick={() => void syncDevice()} disabled={deviceSyncing}><RefreshCw size={15} className={deviceSyncing ? 'spin' : ''} /> {deviceSyncing ? 'Syncing...' : 'Sync devices'}</button>} /><Panel><div className="device-card"><div className="device-icon"><Smartphone size={25} /></div><div className="device-info"><span className="eyebrow">PRIMARY WEARABLE</span><h3>Astro Wrist Monitor</h3><p>Heart rate · Steps · Sleep · SpO₂ (device support dependent)</p><div className="device-meta"><span className="device-connected"><span className="tiny-live-dot" /> {connection === 'live' ? 'Backend connected' : 'Connecting...'}</span><span>Device ID · ASTRO-WATCH-001</span></div></div><span className="device-status">{connection === 'live' ? 'CONNECTED' : 'SYNCING'}</span></div></Panel><Panel><PanelHeading title="Data source configuration" subtitle="Every measurement should preserve its origin and timestamp." /><div className="source-list"><div><span className="source-dot source-watch" /><div><strong>Smartwatch / wearable API</strong><span>Vendor or platform integration required</span></div><b>Connected</b></div><div><span className="source-dot source-manual" /><div><strong>Manual health check-in</strong><span>Entered by astronaut or authorized operator</span></div><b>Supported</b></div></div></Panel><Panel><PanelHeading title="Synchronization history" /><div className="sync-history"><div><CheckCircle2 size={16} /><span>Dashboard service check</span><time>{lastUpdated ? lastUpdated.toLocaleTimeString() : 'Not yet synced'}</time></div><div><Wifi size={16} /><span>Realtime database listener</span><time>{isSupabaseRealtimeConfigured ? 'Configured' : 'Not configured'}</time></div><div><Database size={16} /><span>API polling interval</span><time>{API_BASE ? '15 seconds' : 'Waiting for API URL'}</time></div></div></Panel></div>}

            {activeTab === 'Reports' && <div className="page-stack animate-fadeIn"><PageTitle eyebrow="MISSION PERFORMANCE" title="Reports & exports" subtitle="Generate a portable snapshot of the current dashboard readings." action={<button className="primary-button" onClick={exportCsv}><Download size={15} /> Export CSV</button>} /><div className="activity-summary-grid"><SummaryTile icon={Heart} label="Avg. heart rate" value={`${metrics.heartRate} BPM`} meta="Current snapshot" /><SummaryTile icon={Footprints} label="Step count" value={metrics.steps.toLocaleString()} meta="Today" /><SummaryTile icon={Moon} label="Sleep duration" value={`${metrics.sleep.toFixed(1)} h`} meta="Last cycle" /><SummaryTile icon={ClipboardList} label="Task completion" value={`${progressPercent}%`} meta={`${completedCount} of ${tasks.length} tasks`} /></div><Panel><PanelHeading title="Weekly report preview" subtitle="Activity index for the current sample period" /><div className="large-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={demoTrends['1W']}><CartesianGrid stroke="#17314a" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="time" stroke="#7891a9" axisLine={false} tickLine={false} /><YAxis stroke="#7891a9" axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: '#071426', border: '1px solid #1e4968', borderRadius: 12 }} /><Bar dataKey="Steps" fill="#438cff" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></Panel><div className="disclaimer-note"><FileText size={14} /><span>CSV export contains the current dashboard snapshot. It is not a validated clinical or mission operations report.</span></div></div>}

            {activeTab === 'Research' && <div className="page-stack animate-fadeIn"><PageTitle eyebrow="EVIDENCE LIBRARY" title="Research library" subtitle="Research references are context for interpretation, not live astronaut telemetry." /><div className="research-grid"><ResearchCard id="OSD-343" title="Spaceflight omics research" description="Research metadata and study context from NASA Open Science Data Repository. Consult the original dataset documentation before interpreting variables." /><ResearchCard id="OSD-684" title="Space biology research" description="A second research reference for discovery and scientific context. Dataset measurements must not be presented as personal wearable vital signs." /><ResearchCard id="OSDR" title="Open Science Data Repository" description="Use verified source metadata, dataset identifiers, measurement units, dates and limitations when displaying research evidence." /></div><Panel><PanelHeading title="Evidence provenance checklist" /><div className="source-list"><div><span className="source-dot source-watch" /><div><strong>Source URL and dataset identifier</strong><span>Keep the original source accessible</span></div><b>Required</b></div><div><span className="source-dot source-manual" /><div><strong>Collection date, variables and units</strong><span>Explain the meaning of each field</span></div><b>Required</b></div><div><span className="source-dot source-demo" /><div><strong>Transformation and limitations</strong><span>Separate research context from personal measurements</span></div><b>Required</b></div></div></Panel></div>}

            {activeTab === 'Settings' && <div className="page-stack settings-page animate-fadeIn">
              <PageTitle eyebrow="YOUR WORKSPACE" title="Settings" subtitle="Manage your profile and personalise your AstroVitals experience." />

              <div className="settings-layout">
                <Panel className="settings-account-panel">
                  <PanelHeading title="Astronaut profile" subtitle="Your account information" action={<button className="ghost-button" onClick={() => setEditModalOpen(true)}><Edit3 size={15} /> Edit profile</button>} />
                  <div className="settings-profile-summary">
                    <div className="settings-large-avatar">{initials(user?.full_name)}</div>
                    <div className="settings-profile-details">
                      <strong>{displayName}</strong>
                      <span>{profilePosition}</span>
                      <div className="settings-profile-tags"><span>{user?.badge_id || 'AST-001'}</span><span className="settings-active-tag"><i /> Active crew member</span></div>
                    </div>
                  </div>
                  <div className="settings-facts">
                    <div><span>Age</span><strong>{profileAge} years</strong></div>
                    <div><span>Height</span><strong>{profileHeight} cm</strong></div>
                    <div><span>Weight</span><strong>{profileWeight} kg</strong></div>
                  </div>
                </Panel>

                <Panel className="settings-preferences-panel">
                  <PanelHeading title="Preferences" subtitle="Choose how your workspace behaves" />
                  <div className="preference-list">
                    <div className="preference-row">
                      <span className="preference-icon"><RefreshCw size={18} /></span>
                      <div className="preference-copy"><strong>Automatic data refresh</strong><span>Update dashboard readings every 15 seconds.</span></div>
                      <button type="button" className={`preference-switch ${autoRefresh ? 'is-on' : ''}`} onClick={() => setAutoRefresh((value) => !value)} aria-pressed={autoRefresh} aria-label="Toggle automatic data refresh"><i /></button>
                    </div>
                    <div className="preference-row">
                      <span className="preference-icon"><Bell size={18} /></span>
                      <div className="preference-copy"><strong>Health alert notifications</strong><span>Show important health notifications in your workspace.</span></div>
                      <button type="button" className={`preference-switch ${alertNotifications ? 'is-on' : ''}`} onClick={() => setAlertNotifications((value) => !value)} aria-pressed={alertNotifications} aria-label="Toggle health alert notifications"><i /></button>
                    </div>
                    <div className="preference-row">
                      <span className="preference-icon"><CalendarDays size={18} /></span>
                      <div className="preference-copy"><strong>Weekly summary card</strong><span>Show the weekly activity summary on your dashboard.</span></div>
                      <button type="button" className={`preference-switch ${showWeeklySummary ? 'is-on' : ''}`} onClick={() => setShowWeeklySummary((value) => !value)} aria-pressed={showWeeklySummary} aria-label="Toggle weekly summary card"><i /></button>
                    </div>
                    <div className="preference-row preference-row-last">
                      <span className="preference-icon"><Activity size={18} /></span>
                      <div className="preference-copy"><strong>Default trend period</strong><span>Choose the time range shown in health charts.</span></div>
                      <select className="preference-select" value={timeFilter} onChange={(event) => { const value = event.target.value as '1D' | '1W' | '1M' | '3M'; setTimeFilter(value); }} aria-label="Default trend period"><option value="1D">24 hours</option><option value="1W">7 days</option><option value="1M">30 days</option><option value="3M">3 months</option></select>
                    </div>
                  </div>
                </Panel>
              </div>

              <Panel className="settings-data-panel">
                <PanelHeading title="Data & privacy" subtitle="Your information should always be handled with care" />
                <div className="settings-privacy-content">
                  <span className="privacy-shield"><ShieldCheck size={23} /></span>
                  <div><strong>Your health information matters.</strong><p>AstroVitals keeps readings, activity and their data sources together so information can be reviewed in context. Access to real health information should be limited to authorised people.</p></div>
                  <span className={`privacy-status ${connection === 'live' ? 'privacy-live' : 'privacy-demo'}`}><i /> {connection === 'live' ? 'Connected' : 'Connecting'}</span>
                </div>
              </Panel>
            </div>}

          </div>
          <footer className="app-footer"><span>ASTROVITALS <i /> CREW HEALTH</span><span>Clear insights for healthier missions</span></footer>
        </main>
      </div>
      {toast && <div className="toast-message"><CheckCircle2 size={16} />{toast}</div>}
    </div>
  );
}

function PageTitle({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: ReactNode }) {
  return <div className="page-title-row"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}

function SummaryTile({ icon: Icon, label, value, meta }: { icon: LucideIcon; label: string; value: string; meta: string }) {
  return <article className="summary-tile"><span className="summary-icon"><Icon size={18} /></span><span className="summary-label">{label}</span><strong>{value}</strong><small>{meta}</small></article>;
}

function ResearchCard({ id, title, description }: { id: string; title: string; description: string }) {
  return <article className="research-card"><div className="research-icon"><FlaskConical size={21} /></div><span className="research-id">{id}</span><h3>{title}</h3><p>{description}</p><span className="research-link">Research context only <ChevronRight size={14} /></span></article>;
}

export default App;