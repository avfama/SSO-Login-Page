const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitButton = document.getElementById("submit");
const submitLabel = submitButton.querySelector(".submit-label");
const notification = document.getElementById("notification");

let locked = false;

function notify(message, type) {
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.hidden = false;
}

function clearNotification() {
  notification.hidden = true;
  notification.textContent = "";
  notification.className = "notification";
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading || locked;
  submitButton.classList.toggle("loading", isLoading);
  submitLabel.textContent = isLoading ? "Signing in" : "Sign in";
  emailInput.disabled = isLoading || locked;
  passwordInput.disabled = isLoading || locked;
}

function lockForm() {
  locked = true;
  setLoading(false);
  emailInput.disabled = true;
  passwordInput.disabled = true;
  submitButton.disabled = true;
}

async function handleSubmit(event) {
  event.preventDefault();
  if (locked) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    notify("Please enter both your email and password.", "error");
    return;
  }

  clearNotification();
  setLoading(true);

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();

    if (response.ok && data.code === "SUCCESS") {
      notify(data.message, "success");
      window.location.assign(data.redirect);
      return;
    }

    switch (data.code) {
      case "INVALID_USERNAME":
        notify(data.message, "error");
        passwordInput.value = "";
        break;
      case "WRONG_PASSWORD":
        notify(data.message, "warning");
        passwordInput.value = "";
        break;
      case "ACCOUNT_LOCKED":
        notify(data.message, "error");
        lockForm();
        return;
      default:
        notify(data.message || "Unable to sign in. Please try again.", "error");
    }
  } catch (error) {
    notify("Network error. Please check your connection and try again.", "error");
  } finally {
    setLoading(false);
  }
}

form.addEventListener("submit", handleSubmit);
