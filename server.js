import path from "node:path";
import express from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { PROJECT_ROOT, PORT, SESSION_SECRET, WAH4C_URL, MAX_FAILED_ATTEMPTS } from "./src/config.js";
import {
  findUserByEmail,
  findUserById,
  recordFailedAttempt,
  resetFailedAttempts,
  lockUser,
} from "./src/db.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    name: "wah4c.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", maxAge: 1000 * 60 * 60 },
  }),
);
app.use(express.static(path.join(PROJECT_ROOT, "public")));

app.get("/api/session", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ authenticated: false });
  }
  res.json({ authenticated: true, user: req.session.user });
});

app.post("/api/login", (req, res) => {
  const email = String(req.body?.email ?? "").trim();
  const password = String(req.body?.password ?? "");

  if (!email || !password) {
    return res.status(400).json({
      code: "MISSING_FIELDS",
      message: "Please enter both your email and password.",
    });
  }

  const user = findUserByEmail(email);

  // Unknown / mistyped email -> "Invalid Username". This is NOT a failed
  // login attempt and never contributes to the lockout counter.
  if (!user) {
    return res.status(401).json({
      code: "INVALID_USERNAME",
      message: "Invalid Username",
    });
  }

  if (user.is_locked) {
    return res.status(423).json({
      code: "ACCOUNT_LOCKED",
      message:
        "Your account is locked after too many failed login attempts. Contact your administrator to restore access.",
    });
  }

  const passwordMatches = bcrypt.compareSync(password, user.password_hash);

  if (passwordMatches) {
    resetFailedAttempts(user.id);
    req.session.user = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
    };
    return res.json({
      code: "SUCCESS",
      message: `Welcome back, ${user.full_name}. Redirecting to WAH4C...`,
      redirect: `${WAH4C_URL}?account=${encodeURIComponent(user.email)}`,
    });
  }

  const updated = recordFailedAttempt(user.id);

  // Lock out once failed attempts exceed the tolerated maximum (i.e. > 3).
  if (updated.failed_attempts > MAX_FAILED_ATTEMPTS) {
    lockUser(user.id);
    return res.status(423).json({
      code: "ACCOUNT_LOCKED",
      message:
        "Your account has been locked after too many failed login attempts. Contact your administrator to restore access.",
    });
  }

  const attemptsRemaining = MAX_FAILED_ATTEMPTS + 1 - updated.failed_attempts;
  return res.status(401).json({
    code: "WRONG_PASSWORD",
    message: `Incorrect password. ${attemptsRemaining} attempt${
      attemptsRemaining === 1 ? "" : "s"
    } remaining before your account is locked.`,
  });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

const server = app.listen(PORT, () => {
  console.log(`WAHrden SSO login page running at http://localhost:${PORT}`);
  console.log(`Redirect target: ${WAH4C_URL}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Start on another port, e.g. PORT=4100 npm start`,
    );
    process.exit(1);
  }
  throw error;
});
