"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardData = void 0;
const supabase_1 = require("../config/supabase");
const getDashboardData = async (_req, res) => {
    try {
        const { data: readings, error: rErr } = await supabase_1.supabase
            .from('health_readings')
            .select('*, astronaut_profiles(full_name, badge_id)')
            .order('recorded_at', { ascending: false })
            .limit(50);
        const { data: tasks, error: tErr } = await supabase_1.supabase
            .from('task_completions')
            .select('*')
            .order('completed_at', { ascending: false })
            .limit(10);
        const { data: alerts, error: aErr } = await supabase_1.supabase
            .from('health_alerts')
            .select('*')
            .eq('is_acknowledged', false)
            .order('created_at', { ascending: false });
        if (rErr || tErr || aErr)
            throw rErr || tErr || aErr;
        return res.status(200).json({
            success: true,
            readings: readings || [],
            tasks: tasks || [],
            alerts: alerts || []
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};
exports.getDashboardData = getDashboardData;
