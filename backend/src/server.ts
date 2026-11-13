// backend/src/server.ts
import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes'; // Eta add korun

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

export default app;

if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`🚀 Server running locally on port ${port}`));
}