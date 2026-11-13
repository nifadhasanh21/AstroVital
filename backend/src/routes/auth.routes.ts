// backend/src/routes/auth.routes.ts
import { Router } from 'express';
import { registerUser, loginUser, updateProfile } from '../controllers/auth.controller'; // updateProfile add korun

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/profile', updateProfile); 

export default router;