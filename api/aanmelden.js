// Vercel serverless function: zet een aanmelding van fsnprime.nl direct in RecruitCRM.
// Nodig in Vercel (Settings > Environment Variables):
//   RECRUITCRM_API_KEY   = API-token uit RecruitCRM (Admin Settings > API & Integrations)
//   PRIME_JOB_SLUG       = optioneel, standaard de Prime-vacature
//   FREELANCE_JOB_SLUG   = optioneel, vacature voor freelance 50/50
const API = 'https://api.recruitcrm.io/v1';
const PRIME_JOB = process.env.PRIME_JOB_SLUG || '17879152355040136156Adz';
const APPLIED_STAGE = 10; // "Applied" in de Master Hiring Pipeline
const FREELANCE_JOB = process.env.FREELANCE_JOB_SLUG || PRIME_JOB; // standaard dezelfde partnervacature

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const key = process.env.RECRUITCRM_API_KEY;
  if (!key) return res.status(500).json({ ok: false, error: 'not_configured' });

  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  if (b.website) return res.status(200).json({ ok: true }); // honeypot
  const first = (b.first_name || '').trim(), last = (b.last_name || '').trim(), email = (b.email || '').trim();
  if (!first || !last || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !b.consent) {
    return res.status(400).json({ ok: false, error: 'invalid' });
  }
  const route = b.route === 'freelance' ? 'freelance' : 'prime';
  const auth = { Authorization: `Bearer ${key}`, Accept: 'application/json' };

  try {
    const fd = new FormData();
    fd.append('first_name', first);
    fd.append('last_name', last);
    fd.append('email', email);
    if (b.phone) fd.append('contact_number', String(b.phone).trim());
    if (b.linkedin) fd.append('profile_linkedin', String(b.linkedin).trim());
    if (b.city) fd.append('city', String(b.city).trim());
    fd.append('source', route === 'freelance' ? 'fsnprime.nl | Freelance 50/50' : 'fsnprime.nl | FSN Prime');
    const extra = [b.focus && `Markt/specialisme: ${b.focus}`, b.hours && `Uren per week: ${b.hours}`, b.message && `Toelichting: ${b.message}`]
      .filter(Boolean).join('\n');
    if (extra) fd.append('summary', extra);
    if (b.cv && b.cv.data && b.cv.name) {
      const buf = Buffer.from(b.cv.data, 'base64');
      if (buf.length > 4 * 1024 * 1024) return res.status(400).json({ ok: false, error: 'cv_too_large' });
      fd.append('resume', new Blob([buf], { type: b.cv.type || 'application/octet-stream' }), b.cv.name);
    }
    const r = await fetch(`${API}/candidates`, { method: 'POST', headers: auth, body: fd });
    const cand = await r.json().catch(() => ({}));
    let slug = cand && cand.slug;
    if (!r.ok || !slug) {
      // Bestaat de kandidaat al (zelfde e-mail)? Zoek hem op en koppel alsnog.
      console.error('create candidate failed', r.status, JSON.stringify(cand).slice(0, 500));
      const sr = await fetch(`${API}/candidates/search?email=${encodeURIComponent(email)}`, { headers: auth });
      const found = await sr.json().catch(() => null);
      const list = Array.isArray(found) ? found : (found && (found.data || found.candidates)) || [];
      slug = list[0] && list[0].slug;
      if (!slug) return res.status(502).json({ ok: false, error: 'crm' });
    }
    const job = route === 'freelance' ? FREELANCE_JOB : PRIME_JOB;
    const a = await fetch(`${API}/candidates/${slug}/assign?job_slug=${encodeURIComponent(job)}`, { method: 'POST', headers: auth });
    const aBody = (await a.text()).slice(0, 300);
    if (!a.ok) console.error('assign failed', a.status, aBody);
    else console.log('assigned', slug, 'to', job, route);
    // Zet de kandidaat op "Applied" (stage 10) zodat zichtbaar is dat hij zich zelf heeft aangemeld.
    const st = await fetch(`${API}/candidates/${slug}/hiring-stages/${encodeURIComponent(job)}`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status_id: APPLIED_STAGE, remark: route === 'freelance' ? 'Aanmelding via fsnprime.nl (Freelance 50/50)' : 'Aanmelding via fsnprime.nl (FSN Prime)' }),
    });
    if (!st.ok) console.error('stage update failed', st.status, (await st.text()).slice(0, 300));
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: 'server' });
  }
};
