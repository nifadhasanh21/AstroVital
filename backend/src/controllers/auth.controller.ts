// backend/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, position } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password are required.' });

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: full_name || 'Astronaut', position: position || 'Unassigned' } },
    });

    if (authError) return res.status(400).json({ success: false, error: authError.message });
    if (!authData.user) return res.status(400).json({ success: false, error: 'Please check your email to verify your account.' });

    await supabaseAdmin.from('astronaut_profiles').insert([{
        id: authData.user.id,
        auth_id: authData.user.id,
        full_name: full_name || 'Astronaut',
        position: position || 'Unassigned',
        badge_id: `AST-${Math.floor(Math.random() * 900) + 100}`
    }]);

    return res.status(201).json({ success: true, user: authData.user, session: authData.session });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password required' });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ success: false, error: error.message });
    if (!data.user) return res.status(401).json({ success: false, error: 'Login failed.' });

    const { data: profile } = await supabase.from('astronaut_profiles').select('*').eq('id', data.user.id).maybeSingle();

    return res.status(200).json({ success: true, session: data.session, profile: profile || null, user_metadata: data.user.user_metadata || {} });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { id, full_name, age, height_cm, weight_kg, gender, position } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'User ID is required.' });

    const payload = {
      full_name: full_name || 'Astronaut',
      age: Number(age) || 34,
      height_cm: Number(height_cm) || 180,
      weight_kg: Number(weight_kg) || 72,
      gender: gender || 'Male',
      position: position || 'Unassigned'
    };

    const { data: updatedData, error: updateError } = await supabaseAdmin
      .from('astronaut_profiles')
      .update(payload)
      .eq('id', id)
      .select();

    if (updateError) {
      console.error("❌ Supabase Update Error:", updateError);
      return res.status(400).json({ success: false, error: updateError.message });
    }

    if (!updatedData || updatedData.length === 0) {
      const { data: insertedData, error: insertError } = await supabaseAdmin
        .from('astronaut_profiles')
        .insert([{ id: id, auth_id: id, ...payload, badge_id: `AST-${Math.floor(Math.random() * 900) + 100}` }])
        .select();

      if (insertError) {
        console.error("❌ Supabase Insert Error:", insertError);
        return res.status(400).json({ success: false, error: insertError.message });
      }
      return res.status(200).json({ success: true, profile: insertedData[0] });
    }

    return res.status(200).json({ success: true, profile: updatedData[0] });
  } catch (err: any) {
    console.error("❌ Catch Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// KHUB IMPORTANT: Ei function ta obosshoi file er ekdom niche thakbe
export const getAllAstronauts = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('astronaut_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Fetch All Error:", error);
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, users: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};