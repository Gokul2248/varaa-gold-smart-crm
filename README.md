# Varaa Gold Smart Visitor CRM

Mobile-first exhibition lead capture for Varaa Gold.

## Current exhibition flow

This version intentionally **does not run OCR or parse visiting cards during capture**.

1. **Take Photo** opens the phone camera.
2. **Choose Photo** opens the phone photo album.
3. The original card image is retained and sent to Google Drive.
4. Staff enters only **mobile/WhatsApp number** and **shop/company name**.
5. Staff selects collection interests, notes, priority and follow-up.
6. Backend generates a unique **Record ID / Index**.
7. Google Sheet stores the index, mobile, shop name, preferences and Drive image URL.
8. Existing-customer matching uses normalized mobile number or shop name.
9. Card details can be extracted later from the stored image without slowing down the exhibition capture.

## Cloudflare architecture

- Frontend: `public/index.html`
- Runtime/API: Cloudflare Worker in `worker.js`
- Static assets: Cloudflare Workers Static Assets
- Storage bridge: Google Apps Script → Google Sheet + Google Drive
- Configuration: `wrangler.jsonc`

Required Worker secrets/variables:

```text
GOOGLE_APPS_SCRIPT_URL
GOOGLE_APPS_SCRIPT_SECRET
ADMIN_PASSWORD
```

Do not commit secret values to GitHub.

## Google Apps Script

Copy `google-apps-script.gs` into Google Apps Script.

Set Script Properties:

- `CRM_SECRET` = a long random secret
- The same value must be used as Cloudflare `GOOGLE_APPS_SCRIPT_SECRET`

Run `setup()` once. It creates the Sheet and Drive folder.

Deploy the Apps Script as a Web App:

- Execute as: **Me**
- Who has access: **Anyone**

## Deployment

Connect the repository to Cloudflare Workers and deploy the `main` branch using `wrangler.jsonc`.
