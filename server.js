require("dotenv").config();
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
  const { name, email, role, city } = req.body;

  // Basic validation
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name is required." });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ error: "Email is required." });
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
    role: role.trim(),
    city: city.trim(),
    source: "Styleconnect Waitlist Landing Page",
    createdAt: new Date().toISOString(),
  };

  waitlist.push(newEntry);

  if (writeWaitlist(waitlist)) {
    const convertkitApiKey = process.env.CONVERTKIT_API_KEY;
    const convertkitFormId = process.env.CONVERTKIT_FORM_ID;

    if (convertkitApiKey && convertkitFormId) {
      const isV4 = convertkitApiKey.startsWith("kit_");

      if (isV4) {
        const createPayload = {
          email_address: newEntry.email,
          first_name: newEntry.name,
          fields: {
            role: newEntry.role,
            city: newEntry.city
          }
        };

        fetch("https://api.kit.com/v4/subscribers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "X-Kit-Api-Key": convertkitApiKey
          },
          body: JSON.stringify(createPayload)
        })
        .then(async (createResponse) => {
          const createData = await createResponse.json();
          if (!createResponse.ok) {
            console.error("Kit V4 create subscriber error response:", createData);
            return;
          }
          
          console.log("Successfully created/updated subscriber on Kit V4:", createData);

          const linkPayload = {
            email_address: newEntry.email
          };

          return fetch(`https://api.kit.com/v4/forms/${convertkitFormId}/subscribers`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "X-Kit-Api-Key": convertkitApiKey
            },
            body: JSON.stringify(linkPayload)
          });
        })
        .then(async (linkResponse) => {
          if (!linkResponse) return;
          const linkData = await linkResponse.json();
          if (!linkResponse.ok) {
            console.error("Kit V4 add to form error response:", linkData);
          } else {
            console.log("Successfully added subscriber to Kit V4 form:", linkData);
          }
        })
        .catch((error) => {
          console.error("Failed to connect to Kit V4 API:", error);
        });
      } else {
        const payload = {
          api_key: convertkitApiKey,
          email: newEntry.email,
          first_name: newEntry.name,
          fields: {
            role: newEntry.role,
            city: newEntry.city
          }
        };

        fetch(`https://api.convertkit.com/v3/forms/${convertkitFormId}/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(payload)
        })
        .then(async (response) => {
          const responseData = await response.json();
          if (!response.ok) {
            console.error("ConvertKit V3 API error response:", responseData);
          } else {
            console.log("Successfully subscribed to ConvertKit V3:", responseData);
          }
        })
        .catch((error) => {
          console.error("Failed to connect to ConvertKit V3 API:", error);
        });
      }
    } else {
      console.warn("ConvertKit credentials are not configured. Submissions are saved locally only.");
    }

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
