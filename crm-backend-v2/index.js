// // calirocks-backend-v2/index.js
// require("dotenv").config();

// const express = require("express");
// const cors = require("cors");

// const googleCalendarRouter = require("./src/routes/integrations/googleCalendar");
// const authRouter = require("./src/routes/auth"); // 👈 NEW

// const app = express();

// app.use(
//   cors({
//     origin: true,
//     credentials: true,
//   })
// );
// app.use(express.json());

// // Health
// app.get("/api/v2/health", (req, res) => {
//   res.json({ ok: true });
// });

// // ✅ Auth routes
// app.use("/api/v2/auth", authRouter);

// // Google Calendar routes
// app.use("/api/v2/integrations/google-calendar", googleCalendarRouter);

// const PORT = process.env.PORT || 4000;
// app.listen(PORT, () => {
//   console.log(`Backend listening on port ${PORT}`);
//   // console.log(
//   //   "Google Calendar redirect URI:",
//   //   process.env.GOOGLE_CALENDAR_REDIRECT_URI
//   // );
// });


// calirocks-backend-v2/index.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const googleCalendarRouter = require("./src/routes/integrations/googleCalendar");
const authRouter = require("./src/routes/auth");

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health check
app.get("/api/v2/health", (req, res) => {
  res.json({ ok: true });
});

// Routes
app.use("/api/v2/auth", authRouter);
app.use("/api/v2/integrations/google-calendar", googleCalendarRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});


// const themeRouter = require("./src/routes/theme");
// app.use("/api/v2/theme", themeRouter);
