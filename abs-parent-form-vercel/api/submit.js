const { google } = require("googleapis");

function cleanCell(value) {
  if (value === undefined || value === null) return "";
  // Google Sheets API uses RAW input below, so text is stored as text.
  return String(value).trim();
}

function getServiceAccountAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!email || !privateKey) {
    throw new Error("Google Sheets credentials are not configured on the server.");
  }
  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }

  try {
    const d = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    if (!d || typeof d !== "object" || Array.isArray(d)) {
      return res.status(400).json({ ok: false, error: "Invalid form data." });
    }

    const required = ["studentName", "classSection", "locality", "parentName", "income", "transport", "distance"];
    const missing = required.filter(k => !String(d[k] ?? "").trim());
    if (missing.length) {
      return res.status(400).json({ ok: false, error: "Please fill all required fields." });
    }
    if (d.pin && !/^\d{6}$/.test(String(d.pin).trim())) {
      return res.status(400).json({ ok: false, error: "PIN code must be 6 digits." });
    }

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      throw new Error("GOOGLE_SHEET_ID is not configured on the server.");
    }

    const auth = getServiceAccountAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const f = d.father || {};
    const m = d.mother || {};
    const others = (Array.isArray(d.others) ? d.others : [])
      .filter(o => o && (o.name || o.cls || o.school))
      .map(o => [cleanCell(o.name), cleanCell(o.cls), cleanCell(o.school)].join(" | "))
      .join("\n");

    const values = [[
      new Date().toISOString(),
      cleanCell(d.studentName),
      cleanCell(d.classSection),
      cleanCell(d.admissionNo),
      cleanCell(d.locality),
      cleanCell(d.pin),
      cleanCell(d.abChildren),
      others,
      cleanCell(f.occupation),
      cleanCell(f.title),
      cleanCell(f.org),
      cleanCell(f.status),
      cleanCell(m.occupation),
      cleanCell(m.title),
      cleanCell(m.org),
      cleanCell(m.status),
      cleanCell(d.income),
      cleanCell(d.transport),
      cleanCell(d.distance),
      cleanCell(d.schoolTransport),
      cleanCell(d.parentName)
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Responses!A:U",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values }
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Form submission failed:", err && err.message ? err.message : err);
    return res.status(500).json({
      ok: false,
      error: "Could not save your form. Please try again or contact the school administrator."
    });
  }
};
