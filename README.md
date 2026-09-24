# Varaa Gold Smart Visitor & Follow-up CRM

Mobile-first B2B exhibition lead capture for Varaa Gold.

## Architecture
- Frontend + serverless API: Cloudflare Pages + Pages Functions
- Backend storage: Google Drive (Google Sheet for structured leads + Drive folder for visiting-card images)
- OCR: Tesseract.js in browser
- Admin dashboard: password-protected through the cloud API

## Google Drive setup
1. Create/open a Google Apps Script project using the Google account that should own the CRM data.
2. Paste `google-apps-script.gs`.
3. Replace `REPLACE_WITH_A_LONG_RANDOM_SECRET` with a long random secret.
4. Run `setup()` once and authorize Drive/Sheets access.
5. Deploy as a Web app: Execute as Me; Who has access: Anyone.
6. Copy the Web App URL.

## Cloudflare environment variables
Set these in Workers & Pages > your project > Settings > Environment variables:
- `GOOGLE_APPS_SCRIPT_URL` = Apps Script Web App URL
- `GOOGLE_APPS_SCRIPT_SECRET` = same secret used in Apps Script
- `ADMIN_PASSWORD` = password for the Varaa admin dashboard

The production API is implemented as `functions/api/leads.js` for Cloudflare Pages Functions.

## Deployment
Connect this GitHub repository to Cloudflare Pages, use `main` as the production branch, leave the build command empty for the static root, and deploy. Cloudflare Pages automatically redeploys when new commits are pushed.

## Notes
This MVP deliberately avoids a complex AI layer so it can be used quickly at the exhibition. AI can be added later for card extraction, lead summarization, duplicate detection, follow-up recommendations and collection matching.
