# FSN Prime website

Statische one-pager (HTML + CSS, geen build nodig).

## Live zetten op Vercel
1. Importeer deze repository in Vercel (Add New > Project).
2. Framework preset: "Other". Build command: leeg. Output directory: leeg (root).
3. Deploy. Daarna je eigen domein koppelen bij Settings > Domains.

## Aanpassen
- Teksten staan in `index.html`.
- Foto's en logo staan in `assets/`.

## Aanmeldformulier (api/aanmelden.js)
Het formulier "Partner worden" zet aanmeldingen direct in RecruitCRM. Zet in Vercel onder
Settings > Environment Variables:

- `RECRUITCRM_API_KEY`: API-token uit RecruitCRM (Admin Settings > API & Integrations)
Zowel Prime- als freelance-aanmeldingen worden gekoppeld aan vacature 75 "Recruitment Partner (zelfstandig) | FSN Prime".
Het verschil zie je aan de bron: "fsnprime.nl | FSN Prime" of "fsnprime.nl | Freelance 50/50".
Na het toevoegen van een variabele: Deployments > laatste deployment > Redeploy.
