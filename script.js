const form = document.querySelector("#waitlist-form");
const statusEl = document.querySelector("#form-status");

// Role management setup
const roleTabs = document.querySelectorAll(".role-tab");
const selectedRoleInput = document.querySelector("#selected-role");
const roleDescriptionEl = document.querySelector("#role-description");

const roleDescriptions = {
  "Fashion Seeker": "Find fashion designers & fabric sellers, get perfect measurements, and order custom outfits.",
  "Fashion Designer": "Join as a designer, showcase your portfolio, manage clients, and grow your fashion brand.",
  "Fabric Seller": "Join as a fabric seller, list your inventory, and connect directly with designers & customers."
};

roleTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    // Update active tab styling
    roleTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    
    // Update hidden input and description text
    const role = tab.getAttribute("data-role");
    selectedRoleInput.value = role;
    roleDescriptionEl.textContent = roleDescriptions[role];
  });
});

// City Selector Modal management
const citySelectorBtn = document.querySelector("#city-selector-btn");
const cityLabel = document.querySelector("#selected-city-label");
const selectedCityInput = document.querySelector("#selected-city");
const cityModal = document.querySelector("#city-modal");
const closeModalBtn = document.querySelector("#close-modal-btn");
const citySearchInput = document.querySelector("#city-search");
const cityListContainer = document.querySelector("#city-list");

const cities = [
  "Lagos",
  "Ibadan",
  "Abuja",
  "Abeokuta",
  "Akure",
  "Ado-Ekiti",
  "Osogbo",
  "Ilorin",
  "Port Harcourt",
  "Benin City",
  "Enugu"
];

function populateCities(filterText = "") {
  cityListContainer.innerHTML = "";
  const filtered = cities.filter(city => 
    city.toLowerCase().includes(filterText.toLowerCase())
  );
  
  if (filtered.length === 0) {
    const noResults = document.createElement("p");
    noResults.textContent = "No cities found";
    noResults.style.color = "rgba(255, 255, 255, 0.4)";
    noResults.style.fontSize = "0.9rem";
    noResults.style.padding = "0.5rem 1rem";
    noResults.style.margin = "0";
    cityListContainer.appendChild(noResults);
    return;
  }
  
  filtered.forEach(city => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "city-option";
    if (selectedCityInput.value === city) {
      btn.classList.add("selected");
    }
    btn.textContent = city;
    btn.addEventListener("click", () => {
      selectCity(city);
    });
    cityListContainer.appendChild(btn);
  });
}

function selectCity(city) {
  selectedCityInput.value = city;
  cityLabel.textContent = city;
  closeCityModal();
}

function openCityModal() {
  cityModal.classList.add("open");
  cityModal.setAttribute("aria-hidden", "false");
  citySearchInput.value = "";
  populateCities();
  citySearchInput.focus();
}

function closeCityModal() {
  cityModal.classList.remove("open");
  cityModal.setAttribute("aria-hidden", "true");
}

citySelectorBtn.addEventListener("click", openCityModal);
closeModalBtn.addEventListener("click", closeCityModal);

// Close modal when clicking outside the card
cityModal.addEventListener("click", (e) => {
  if (e.target === cityModal) {
    closeCityModal();
  }
});

// Close modal on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && cityModal.classList.contains("open")) {
    closeCityModal();
  }
});

citySearchInput.addEventListener("input", (e) => {
  populateCities(e.target.value);
});

// Form inputs and validation
const fields = {
  name: {
    input: document.querySelector("#full-name"),
    error: document.querySelector("#name-error"),
    validate(value) {
      return value.trim().length >= 2 ? "" : "Enter your name so we know who to contact.";
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
  phone: {
    input: document.querySelector("#phone-number"),
    error: document.querySelector("#phone-error"),
    validate(value) {
      const compact = value.replace(/[^\d+]/g, "");
      return compact.length >= 8 ? "" : "Enter a phone number with at least 8 digits.";
    },
  },
  city: {
    input: selectedCityInput,
    error: document.querySelector("#city-error"),
    validate(value) {
      return value.trim() ? "" : "Please select a city.";
    }
  }
};

function setFieldError(name, message) {
  const field = fields[name];
  if (!field.error) return;
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

// Attach live input listeners to fields for dynamic validation
Object.entries(fields).forEach(([name, field]) => {
  field.input.addEventListener("input", () => {
    if (field.input.getAttribute("aria-invalid") === "true") {
      setFieldError(name, field.validate(field.input.value));
    }
  });
});

// Handle waitlist submission
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusEl.textContent = "";
  
  const errors = validateForm();
  const firstInvalid = Object.entries(errors).find(([, message]) => Boolean(message));
  if (firstInvalid) {
    if (firstInvalid[0] === "city") {
      citySelectorBtn.focus();
    } else {
      fields[firstInvalid[0]].input.focus();
    }
    return;
  }
  
  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Joining...";
  
  const payload = {
    name: fields.name.input.value.trim(),
    email: fields.email.input.value.trim(),
    phone: fields.phone.input.value.trim(),
    role: selectedRoleInput.value,
    city: selectedCityInput.value
  };
  
  try {
    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || "Submission failed");
    }
    
    form.reset();
    selectedCityInput.value = "Ibadan";
    cityLabel.textContent = "Ibadan";
    
    Object.keys(fields).forEach((name) => setFieldError(name, ""));
    statusEl.textContent = "You're on the list! We will reach out when Styleconnect is ready.";
    statusEl.style.color = "var(--color-cream-soft)";
  } catch (error) {
    statusEl.textContent = error.message || "Could not save your details. Please try again.";
    statusEl.style.color = "#ffc9b8";
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
