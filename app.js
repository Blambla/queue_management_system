const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Global queue
let queue = [];
let nextNumber = 1;

// 5 counters, each with its current number
let counters = {};
for (let i = 1; i <= 5; i++) {
  counters[i] = null;
}

// Take a number
app.post("/take_number", (req, res) => {
  const ticket = nextNumber;
  queue.push(ticket);
  nextNumber += 1;
  res.json({ your_number: ticket });
});

// Call next for a counter
app.post("/call_next/:counter_id", (req, res) => {
  const counterId = parseInt(req.params.counter_id);

  if (!(counterId in counters)) {
    return res.status(400).json({ error: "Invalid counter" });
  }

  if (queue.length > 0) {
    const current = queue.shift(); // take from global queue
    counters[counterId] = current;
    res.json({ counter: counterId, called_number: current });
  } else {
    res.json({ message: "No one in queue" });
  }
});

// Status of counters
app.get("/status", (req, res) => {
  res.json(counters);
});

// Queue status
app.get("/queue", (req, res) => {
  res.json({ waiting: queue });
});

// Manually set counter
app.post("/set_counter/:counter_id/:number", (req, res) => {
  const counterId = parseInt(req.params.counter_id);
  const number = parseInt(req.params.number);

  if (!(counterId in counters)) {
    return res.status(400).json({ error: "Invalid counter" });
  }

  counters[counterId] = number;
  res.json({ message: `Counter ${counterId} set to ${number}.` });
});

// Reset counters and queue
app.post("/reset_counters", (req, res) => {
  for (let key in counters) {
    counters[key] = null;
  }
  queue = [];
  nextNumber = 1;
  res.json({ message: "All counters and queue reset." });
});

// Optional QR code route (needs 'qrcode' package)
// const QRCode = require("qrcode");
// app.get("/ticket/:number", async (req, res) => {
//   const number = req.params.number;
//   const url = `http://localhost:3000/customer.html?number=${number}`;
//   try {
//     const qr = await QRCode.toBuffer(url);
//     res.type("png").send(qr);
//   } catch (err) {
//     res.status(500).json({ error: "QR generation failed" });
//   }
// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});