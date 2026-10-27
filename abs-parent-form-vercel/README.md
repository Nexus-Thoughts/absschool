# ABS Parent Info Form — Vercel + Google Sheets

This project preserves the supplied HTML form and replaces its `claude.use("db")` submission with a POST request to `/api/submit`. The Vercel serverless function appends one row to the `Responses` tab of your Google Sheet.

## Files
- `index.html` — form frontend
- `api/submit.js` — server-side endpoint; Google credentials never go in the browser
- `package.json` — Google Sheets API dependency
- `vercel.json` — Vercel function configuration

## 1. Prepare Google Sheets access
1. Open Google Cloud Console: https://console.cloud.google.com/
2. Create/select a project.
3. In APIs & Services → Library, enable **Google Sheets API**.
4. Go to IAM & Admin → Service Accounts → Create service account.
5. Open the service account and create a JSON key. Keep the downloaded JSON private; do not upload it to GitHub or put it in the website files.
6. Open the target Google Sheet. Copy the spreadsheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
7. Share the sheet with the service account's email address (ends in `iam.gserviceaccount.com`) and give it **Editor** access.
8. Ensure the spreadsheet has a tab named exactly `Responses`. Row 1 should have these headers (21 columns):
   `Timestamp, Student Name, Class & Section, Admission No, Area / Locality, PIN Code, Children in ABS schools, Children in other schools, Father/Guardian 1 - Occupation, Father/Guardian 1 - Job title, Father/Guardian 1 - Organisation, Father/Guardian 1 - Work status, Mother/Guardian 2 - Occupation, Mother/Guardian 2 - Job title, Mother/Guardian 2 - Organisation, Mother/Guardian 2 - Work status, Monthly family income, Travel to school, Distance to school, Would consider school transport, Parent/Guardian Name`
   If there is already data, do not overwrite it; just verify the headers match.

## 2. Deploy to Vercel
1. Put the contents of this project folder in a GitHub repository. Do not include any service-account JSON key file.
2. Go to https://vercel.com/new and import that repository.
3. Framework preset: **Other**. Deploy.
4. In Vercel → Project → Settings → Environment Variables, add:
   - `GOOGLE_SHEET_ID` = the spreadsheet ID from the Google Sheets URL
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` = `client_email` from the downloaded service-account JSON
   - `GOOGLE_PRIVATE_KEY` = `private_key` from that JSON
   Add them to Production (and Preview if you will test Preview deployments). For `GOOGLE_PRIVATE_KEY`, paste the full private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`; if Vercel's input requires it on one line, replace line breaks with literal `\n`.
5. Redeploy after adding environment variables.

## 3. Test
1. Open the deployed Vercel URL.
2. Fill in a clearly marked test submission (avoid real family data for testing) and submit.
3. Check the `Responses` tab for a new row.
4. If it fails, inspect Vercel → Project → Functions/Logs. The browser intentionally shows a generic error and does not expose credentials.

## Notes
- Do not place Google credentials in `index.html` or any client-side JavaScript.
- Anyone with the public form URL can attempt to submit data. Before distributing widely, consider adding CAPTCHA/rate limiting and school-approved privacy notice/retention controls.
- This code appends to an existing `Responses` tab; it does not create the tab or headers automatically.
