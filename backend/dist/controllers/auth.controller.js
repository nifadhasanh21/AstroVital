"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const supabase_1 = require("../config/supabase");
const registerUser = async (req, res) => {
    try {
        const { email, password, full_name } = req.body;
        const { data, error } = await supabase_1.supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name } }
        });
        if (error)
            throw error;
        return res.status(201).json({ success: true, user: data.user, session: data.session });
    }
    catch (err) {
        return res.status(400).json({ success: false, error: err.message });
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data, error } = await supabase_1.supabase.auth.signInWithPassword({ email, password });
        if (error)
            throw error;
        const { data: profile } = await supabase_1.supabase
            .from('astronaut_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
        return res.status(200).json({ success: true, session: data.session, profile });
    }
    catch (err) {
        return res.status(401).json({ success: false, error: err.message });
    }
};
exports.loginUser = loginUser;
