import axios from 'axios';

// Default to localhost server in development if VITE_API_BASE is not provided.
const DEFAULT_API_BASE = import.meta.env.MODE === 'development' ? 'http://localhost:5000' : '';
const API_BASE = import.meta.env.VITE_API_BASE || DEFAULT_API_BASE || '';

export async function generateCitationPlan(business) {
  const url = `${API_BASE}/tools/citation/generate-citation-plan`;
  const res = await axios.post(url, { business });
  return res.data;  
}

export async function getCitationJobStatus(jobId) {
  const url = `${API_BASE}/tools/citation/${jobId}/status`;
  const res = await axios.get(url);
  return res.data;
}

export async function rerunCitationLookup(citationId) {
  const url = `${API_BASE}/tools/citation/${citationId}/lookup`;
  console.log('rerunCitationLookup POST', url, { citationId });
  const res = await axios.post(url);
  return res.data;
}

export default { generateCitationPlan, getCitationJobStatus, rerunCitationLookup };
