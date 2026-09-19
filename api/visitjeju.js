import { fetchPage } from '../server/visitjeju.js';
export default async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'GET') return res.status(405).json({error:'method_not_allowed'});
  const raw = new URL(req.url, 'https://local.invalid').searchParams.get('page') || '1';
  if (!/^[1-9]\d{0,2}$/.test(raw) || Number(raw)>100) return res.status(400).json({error:'invalid_page'});
  const key = process.env.VISITJEJU_API_KEY?.trim();
  if (!key) return res.status(503).json({error:'not_configured'});
  try {
    const data = await fetchPage(Number(raw), key);
    res.setHeader('Cache-Control','public, max-age=0, s-maxage=86400');
    return res.status(200).json(data);
  } catch {
    // Never expose upstream request URLs, credentials or raw exception messages.
    return res.status(502).json({error:'visitjeju_unavailable'});
  }
}
