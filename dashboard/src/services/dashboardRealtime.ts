// dashboard/src/services/dashboardRealtime.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
    realtime: { params: { eventsPerSecond: 10 } },
  });
}

export function subscribeDashboardRealtime(onChange: () => void): () => void {
  if (!client) return () => undefined;

  const tables = [
    'health_records',    // <--- Flutter App er table ta add kora hoyeche
    'health_readings',   // Web er purono table (backward compatibility)
    'daily_activities',
    'daily_checkins',
    'health_alerts',
    'task_completions',
    'devices',
  ];

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  const notify = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(onChange, 350);
  };

  let channel = client.channel('astrovitals-dashboard-live');
  tables.forEach((table) => {
    channel = channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      notify,
    );
  });
  channel.subscribe();

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (client && channel) void client.removeChannel(channel);
  };
}

export const isSupabaseRealtimeConfigured = Boolean(client);