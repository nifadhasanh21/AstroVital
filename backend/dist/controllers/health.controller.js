"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardSummary = exports.postHealthReading = void 0;
const supabase_1 = require("../config/supabase");
const alert_service_1 = require("../services/alert.service");
const postHealthReading = async (req, res) => {
    try {
        const { astronaut_id, metric_type, value_numeric, value_text, unit, source_type } = req.body;
        const { data, error } = await supabase_1.supabase
            .from('health_readings')
            .insert([{ astronaut_id, metric_type, value_numeric, value_text, unit, source_type }])
            .select();
        if (error)
            throw error;
        if (value_numeric) {
            await alert_service_1.AlertService.checkVitalsAndTriggerAlert(astronaut_id, metric_type, value_numeric);
        }
        return res.status(201).json({ success: true, data });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};
exports.postHealthReading = postHealthReading;
const getDashboardSummary = async (_req, res) => {
    try {
        const { data: latestReadings, error: rErr } = await supabase_1.supabase
            .from('health_readings')
            .select('*, astronaut_profiles(full_name, badge_id)')
            .order('recorded_at', { ascending: false })
            .limit(20);
        const { data: alerts, error: aErr } = await supabase_1.supabase
            .from('health_alerts')
            .select('*, astronaut_profiles(full_name)')
            .eq('is_acknowledged', false)
            .order('created_at', { ascending: false });
        if (rErr || aErr)
            throw rErr || aErr;
        return res.status(200).json({ success: true, latestReadings, activeAlerts: alerts });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};
exports.getDashboardSummary = getDashboardSummary;
