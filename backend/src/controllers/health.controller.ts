import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AlertService } from '../services/alert.service';

export const postHealthReading = async (req: Request, res: Response) => {
  try {
    const { astronaut_id, metric_type, value_numeric, value_text, unit, source_type } = req.body;

    const { data, error } = await supabase
      .from('health_readings')
      .insert([{ astronaut_id, metric_type, value_numeric, value_text, unit, source_type }])
      .select();

    if (error) throw error;

    if (value_numeric) {
      await AlertService.checkVitalsAndTriggerAlert(astronaut_id, metric_type, value_numeric);
    }

    return res.status(201).json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getDashboardSummary = async (_req: Request, res: Response) => {
  try {
    const { data: latestReadings, error: rErr } = await supabase
      .from('health_readings')
      .select('*, astronaut_profiles(full_name, badge_id)')
      .order('recorded_at', { ascending: false })
      .limit(20);

    const { data: alerts, error: aErr } = await supabase
      .from('health_alerts')
      .select('*, astronaut_profiles(full_name)')
      .eq('is_acknowledged', false)
      .order('created_at', { ascending: false });

    if (rErr || aErr) throw rErr || aErr;

    return res.status(200).json({ success: true, latestReadings, activeAlerts: alerts });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};