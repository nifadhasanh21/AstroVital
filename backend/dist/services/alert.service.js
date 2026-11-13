"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertService = void 0;
const supabase_1 = require("../config/supabase");
class AlertService {
    static async checkVitalsAndTriggerAlert(astronautId, metricType, value) {
        let alertMessage = '';
        let severity = '';
        if (metricType === 'heart_rate') {
            if (value > 120) {
                severity = 'Critical';
                alertMessage = `High Heart Rate detected: ${value} BPM! Potential Tachycardia in Microgravity.`;
            }
            else if (value < 45) {
                severity = 'Warning';
                alertMessage = `Abnormally Low Heart Rate detected: ${value} BPM.`;
            }
        }
        else if (metricType === 'spo2' && value < 92) {
            severity = 'Critical';
            alertMessage = `Hypoxia Risk! SpO2 dropped to ${value}%. Check Oxygen Supply.`;
        }
        if (alertMessage) {
            await supabase_1.supabase.from('health_alerts').insert({
                astronaut_id: astronautId,
                severity,
                title: `Anomaly: ${metricType.toUpperCase()}`,
                message: alertMessage
            });
        }
    }
}
exports.AlertService = AlertService;
