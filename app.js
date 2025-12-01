const express = require("express");
const app = express();
const cors = require("cors");
const { google } = require("googleapis");
const path = require("path");

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static("public"));

// Global queue
let queue = [];
let nextNumber = 1;

// Store detailed submissions keyed by ticket number
let customerData = {};

// 5 counters, each with its current number
let counters = {};
for (let i = 1; i <= 5; i++) {
  counters[i] = null;
}

// Take a number
app.post("/api/take_number", (req, res) => {
  const ticket = nextNumber;
  queue.push(ticket);
  nextNumber += 1;
  res.json({ your_number: ticket });
});

// Call next for a counter
app.post("/api/call_next/:counter_id", (req, res) => {
  const counterId = parseInt(req.params.counter_id);

  if (!(counterId in counters)) {
    return res.status(400).json({ error: "Invalid counter" });
  }

  if (queue.length > 0) {
    const current = queue.shift();
    counters[counterId] = current;
    res.json({ counter: counterId, called_number: current });
  } else {
    res.json({ message: "No one in queue" });
  }
});

// Status of counters
app.get("/api/status", (req, res) => {
  res.json(counters);
});

// Queue status
app.get("/api/queue", (req, res) => {
  res.json({ waiting: queue });
});

// ✅ Google Sheets setup
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "queue-management-479913-7b58bd6a0a56.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const sheets = google.sheets({ version: "v4", auth });

// Replace with your actual spreadsheet ID
const SPREADSHEET_ID = "1__0qQuMq4XChiQmdGHq_X470f-4X-hTGtivNGGNHQeQ";

// ✅ Coaching submission route (only one version!)
app.post("/api/submit_coaching", async (req, res) => {
  const { nama, perusahaan, email, phone, coaching, tanggal } = req.body;

  if (!nama || !perusahaan || !email || !phone || !coaching || !tanggal) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const ticket = nextNumber;
  queue.push(ticket);
  nextNumber += 1;

  const submittedAt = new Date().toLocaleString("id-ID");

  // Save to memory
  customerData[ticket] = { nama, perusahaan, email, phone, coaching, tanggal, submitted_at: submittedAt };
  console.log("Saved submission:", customerData[ticket]);

  try {
    const authClient = await auth.getClient();

    await sheets.spreadsheets.values.append({
      auth: authClient,
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:H", // adjust to your sheet/tab name
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          ticket,
          nama,
          perusahaan,
          email,
          phone,
          (coaching || []).join(", "),
          (tanggal || []).join(", "),
          submittedAt
        ]]
      }
    });

    res.json({
      your_number: ticket,
      perusahaan,
      submitted_at: submittedAt
    });
  } catch (err) {
    console.error("Google Sheets error:", err);
    res.status(500).json({ error: "Failed to save to Google Sheets" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

