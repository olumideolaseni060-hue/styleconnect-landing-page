const form = document.querySelector("#waitlist-form");
const statusEl = document.querySelector("#form-status");

const fields = {
  name: {
    input: document.querySelector("#full-name"),
    error: document.querySelector("#name-error"),
    validate(value) {
      return value.trim().length >= 2 ? "" : "Enter your name so we know who to contact.";
    },
  },
  phone: {
    input: document.querySelector("#phone-number"),
    error: document.querySelector("#phone-error"),
    validate(value) {
      const compact = value.replace(/[^\d+]/g, "");
      return compact.length >= 8 ? "" : "Enter a phone number with at least 8 digits.";
    },
  },
  email: {
    input: document.querySelector("#email-address"),
    error: document.querySelector("#email-error"),
    validate(value) {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
      return isEmail ? "" : "Enter a valid email address.";
    },
  },
};

const waitlistConfig = {
  storageKey: "style-connect-waitlist",
  endpoint: "",
};

function setFieldError(name, message) {
  const field = fields[name];
  field.error.textContent = message;
  field.input.setAttribute("aria-invalid", message ? "true" : "false");
}

function validateForm() {
  const errors = {};
  Object.entries(fields).forEach(([name, field]) => {
    const message = field.validate(field.input.value);
    errors[name] = message;
    setFieldError(name, message);
  });
  return errors;
}

function getWaitlistEntries() {
  try {
    return JSON.parse(localStorage.getItem(waitlistConfig.storageKey)) || [];
  } catch {
    return [];
  }
}

async function saveWaitlistEntry(entry) {
  if (waitlistConfig.endpoint) {
    const response = await fetch(waitlistConfig.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    if (!response.ok) throw new Error("Submission failed");
    return;
  }
  const entries = getWaitlistEntries();
  entries.push(entry);
  localStorage.setItem(waitlistConfig.storageKey, JSON.stringify(entries));
}

Object.entries(fields).forEach(([name, field]) => {
  field.input.addEventListener("input", () => {
    if (field.input.getAttribute("aria-invalid") === "true") {
      setFieldError(name, field.validate(field.input.value));
    }
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusEl.textContent = "";
  const errors = validateForm();
  const firstInvalid = Object.entries(errors).find(([, message]) => Boolean(message));
  if (firstInvalid) {
    fields[firstInvalid[0]].input.focus();
    return;
  }
  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Joining";
  const formData = new FormData(form);
  const entry = {
    name: formData.get("name").trim(),
    phone: formData.get("phone").trim(),
    email: formData.get("email").trim(),
    source: "Style Connect landing page",
    createdAt: new Date().toISOString(),
  };
  try {
    await saveWaitlistEntry(entry);
    form.reset();
    Object.keys(fields).forEach((name) => setFieldError(name, ""));
    statusEl.textContent = "You are on the list. We will reach out when Style Connect is ready.";
  } catch {
    statusEl.textContent = "Could not save your details. Please try again in a moment.";
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = '<span>Join the Waitlist</span> <span aria-hidden="true">-&gt;</span>';
  }
});

// Dynamic Countdown Timer (Launch target: August 1, 2026)
function initCountdown() {
  const targetDate = new Date("Aug 1, 2026 00:00:00").getTime();

  const daysVal = document.querySelector("#days");
  const hoursVal = document.querySelector("#hours");
  const minutesVal = document.querySelector("#minutes");
  const secondsVal = document.querySelector("#seconds");

  if (!daysVal || !hoursVal || !minutesVal || !secondsVal) return;

  function updateTimer() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    // If target date is reached
    if (distance < 0) {
      clearInterval(timerInterval);
      daysVal.textContent = "00";
      hoursVal.textContent = "00";
      minutesVal.textContent = "00";
      secondsVal.textContent = "00";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysVal.textContent = String(days).padStart(2, "0");
    hoursVal.textContent = String(hours).padStart(2, "0");
    minutesVal.textContent = String(minutes).padStart(2, "0");
    secondsVal.textContent = String(seconds).padStart(2, "0");
  }

  updateTimer();
  const timerInterval = setInterval(updateTimer, 1000);
}

document.addEventListener("DOMContentLoaded", initCountdown);
initCountdown(); // Run immediately in case DOMContentLoaded has already fired

