const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "waitlist.json");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(__dirname));

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf8");
}

// Helper to read waitlist database
function readWaitlist() {
  try {
    const rawData = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(rawData);
  } catch (error) {
    console.error("Error reading database:", error);
    return [];
  }
}

// Helper to write to waitlist database
function writeWaitlist(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error writing to database:", error);
    return false;
  }
}

// Waitlist Submission Endpoint
app.post("/api/waitlist", (req, res) => {
  const { name, email, phone, role, city } = req.body;

  // Basic validation
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name is required." });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ error: "Email is required." });
  }
  if (!phone || !phone.trim()) {
    return res.status(400).json({ error: "Phone number is required." });
  }
  if (!role || !role.trim()) {
    return res.status(400).json({ error: "Role selection is required." });
  }
  if (!city || !city.trim()) {
    return res.status(400).json({ error: "City selection is required." });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: "Invalid email address format." });
  }

  // Validate phone length
  const compactPhone = phone.replace(/[^\d+]/g, "");
  if (compactPhone.length < 8) {
    return res.status(400).json({ error: "Phone number must have at least 8 digits." });
  }

  const waitlist = readWaitlist();

  // Check for duplicate emails
  const isDuplicate = waitlist.some(
    (entry) => entry.email.toLowerCase() === email.trim().toLowerCase()
  );
  if (isDuplicate) {
    return res.status(400).json({ error: "This email address is already on our waitlist." });
  }

  // Create new entry
  const newEntry = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    role: role.trim(),
    city: city.trim(),
    source: "Styleconnect Waitlist Landing Page",
    createdAt: new Date().toISOString(),
  };

  waitlist.push(newEntry);

  if (writeWaitlist(waitlist)) {
    return res.status(201).json({
      message: "Successfully joined the waitlist!",
      entry: newEntry,
    });
  } else {
    return res.status(500).json({ error: "Internal server error saving waitlist entry." });
  }
});

// Admin Endpoint to check waitlist submissions
app.get("/api/waitlist-admin", (req, res) => {
  const waitlist = readWaitlist();
  res.json(waitlist);
});

// Fallback for SPA or default page
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Styleconnect backend server is running on http://localhost:${PORT}`);
});
