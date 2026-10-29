// src/routes/integrations/googleCalendar.js
const express = require("express");
const querystring = require("querystring");

const router = express.Router();

const {
  GOOGLE_CALENDAR_CLIENT_ID,
  GOOGLE_CALENDAR_REDIRECT_URI,
  FRONTEND_BASE_URL,
} = process.env;

const OAUTH_SCOPE = "https://www.googleapis.com/auth/calendar";
const OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

/**
 * STEP 1: Redirect user to Google for consent
 * GET /api/v2/integrations/google-calendar/authorize
 */
router.get("/authorize", (req, res) => {
  if (!GOOGLE_CALENDAR_CLIENT_ID || !GOOGLE_CALENDAR_REDIRECT_URI) {
    console.error(
      "Google Calendar env vars missing. Check GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_REDIRECT_URI."
    );
    return res
      .status(500)
      .json({ message: "Google Calendar not configured on server" });
  }

  const params = {
    client_id: GOOGLE_CALENDAR_CLIENT_ID,
    redirect_uri: GOOGLE_CALENDAR_REDIRECT_URI,
    response_type: "code",
    scope: OAUTH_SCOPE,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
  };

  const url = `${OAUTH_AUTH_URL}?${querystring.stringify(params)}`;
  console.log("Redirecting to Google OAuth:", url);
  return res.redirect(url);
});

/**
 * STEP 2: Google redirects back here with ?code=...
 * GET /api/v2/integrations/google-calendar/callback
 */
router.get("/callback", (req, res) => {
  const { code, error } = req.query;

  const frontendBase = FRONTEND_BASE_URL || "http://localhost:5173";
  const frontendPath = "/admin/integrations/google-calendar";

  if (error) {
    console.error("Google Calendar OAuth error:", error);
    const redirectUrl = `${frontendBase}${frontendPath}?error=${encodeURIComponent(
      error
    )}`;
    return res.redirect(redirectUrl);
  }

  if (!code) {
    console.error("Google Calendar callback missing ?code");
    const redirectUrl = `${frontendBase}${frontendPath}?error=missing_code`;
    return res.redirect(redirectUrl);
  }

  console.log("Google Calendar auth code:", code);
  // TODO: later, exchange `code` for access/refresh tokens and save them.

  const redirectUrl = `${frontendBase}${frontendPath}?connected=1`;
  return res.redirect(redirectUrl);
});

module.exports = router;
