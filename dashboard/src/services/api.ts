const BASE_URL = 'http://localhost:5000/api';

export const fetchDashboardData = async () => {
  const res = await fetch(`${BASE_URL}/dashboard`);
  return res.json();
};