// Prime-ticker: telt partners en recruiters in gesprek op vacature 75 in RecruitCRM.
// Vercel cachet het antwoord 24 uur, dus RecruitCRM wordt maximaal één keer per dag bevraagd.
const API = 'https://api.recruitcrm.io/v1';
const JOB = process.env.PRIME_JOB_SLUG || '17879152355040136156Adz';
const PLACED = new Set([8]);
// Applied, Interested, Screening, 1st interview, 2nd interview, Offer
const IN_TALKS = new Set([10, 1010228, 855952, 876913, 855955, 855956]);
const FRESH_DAYS = 60;

function statusId(x) {
  const v = (x.status && (x.status.status_id ?? x.status.id)) ?? x.status_id ?? x.candidate_status_id ?? x.hiring_stage_id;
  return Number(v);
}
function stageTime(x) {
  const v = x.stage_date ?? (x.status && x.status.stage_date) ?? x.updated_on ?? (x.candidate && x.candidate.updated_on);
  if (!v) return null;
  const t = typeof v === 'number' ? (v > 1e12 ? v : v * 1000) : Date.parse(v);
  return isNaN(t) ? null : t;
}

module.exports = async (req, res) => {
  const key = process.env.RECRUITCRM_API_KEY;
  if (!key) return res.status(500).json({ ok: false });
  try {
    const rows = [];
    for (let page = 1; page <= 10; page++) {
      const r = await fetch(`${API}/jobs/${JOB}/assigned-candidates?limit=100&page=${page}`, {
        headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
      });
      if (!r.ok) { console.error('stats fetch', r.status, (await r.text()).slice(0, 300)); throw new Error('crm'); }
      const j = await r.json();
      const data = Array.isArray(j) ? j : (j.data || []);
      rows.push(...data);
      if (!j.next_page_url || data.length === 0) break;
    }
    const cutoff = Date.now() - FRESH_DAYS * 864e5;
    let partners = 0, inTalks = 0;
    const byStage = {};
    for (const x of rows) {
      const s = statusId(x);
      byStage[s] = (byStage[s] || 0) + 1;
      if (PLACED.has(s)) partners++;
      else if (IN_TALKS.has(s)) { const t = stageTime(x); if (t === null || t >= cutoff) inTalks++; }
    }
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');
    return res.status(200).json({ ok: true, partners, inTalks, total: rows.length, byStage, updated: new Date().toISOString() });
  } catch (e) {
    res.setHeader('Cache-Control', 's-maxage=600');
    return res.status(502).json({ ok: false });
  }
};
