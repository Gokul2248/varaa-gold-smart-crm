# Varaa Gold Smart CRM

A mobile-first visitor CRM for Varaa Gold exhibitions and jewellery sales teams.

## Architecture

- **Frontend:** Static HTML/CSS/JavaScript in `public/index.html`
- **Hosting/runtime:** Cloudflare Workers with Static Assets
- **API:** `/api/leads` handled by `worker.js`
- **Cloud storage:** Google Apps Script → Google Sheet + Google Drive
- **OCR:** Tesseract.js in the browser
- **Admin dashboard:** Password protected through the Cloudflare Worker

## Cloudflare configuration

The repository contains `wrangler.jsonc` so Cloudflare can deploy the application as a full-stack Worker with static assets.

Required production secrets/variables:

```text
GOOGLE_APPS_SCRIPT_URL
GOOGLE_APPS_SCRIPT_SECRET
ADMIN_PASSWORD
```

Configure these in the Cloudflare Worker under **Settings → Variables and Secrets**. Do not commit their values to GitHub.

## Google Apps Script setup

1. Open Google Apps Script.
2. Copy `google-apps-script.gs` into the project.
3. Set the `SECRET` constant to a long random value.
4. Run `setup()` once and authorize the Google account.
5. Deploy the script as a Web app.
6. Execute as the script owner.
7. Allow anonymous/public access if required by the account so Cloudflare can call the endpoint.
8. Copy the generated `/exec` URL into `GOOGLE_APPS_SCRIPT_URL`.
9. Put the same secret value into `GOOGLE_APPS_SCRIPT_SECRET`.

The Google account that authorizes `setup()` owns the created Sheet and Drive folder.

## Deployment

Connect this GitHub repository to Cloudflare Workers Builds and deploy the `main` branch. The `wrangler.jsonc` file is the source configuration for the Worker and static assets.

Every commit to the configured production branch can trigger a new deployment.

## Local structure

```text
/
├── public/
│   └── index.html
├── worker.js
├── wrangler.jsonc
├── google-apps-script.gs
├── .gitignore
└── README.md
```
