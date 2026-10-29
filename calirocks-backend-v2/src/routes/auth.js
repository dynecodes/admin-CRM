// // src/routes/auth.js
// const express = require("express");
// const router = express.Router();

// /**
//  * TEMP: fake users for local dev.
//  */
// const USERS = [
//   {
//     id: 1,
//     email: "superadmin@calirocks.com",
//     password: "password123",
//     roles: [1], // superadmin
//     firstName: "Super",
//     lastName: "Admin",
//   },
//   {
//     id: 2,
//     email: "admin@calirocks.com",
//     password: "password123",
//     roles: [2], // admin
//     firstName: "Main",
//     lastName: "Admin",
//   },
//   {
//     id: 3,
//     email: "staff@calirocks.com",
//     password: "password123",
//     roles: [4], // staff
//     firstName: "Staff",
//     lastName: "Member",
//   },
// ];

// // POST /api/v2/auth
// router.post("/", (req, res) => {
//   const { user, pwd } = req.body || {};

//   if (!user || !pwd) {
//     return res
//       .status(400)
//       .json({ message: "user and pwd are required fields" });
//   }

//   const foundUser = USERS.find(
//     (u) => u.email.toLowerCase() === String(user).toLowerCase()
//   );

//   if (!foundUser || foundUser.password !== pwd) {
//     return res.status(401).json({ message: "Invalid username or password" });
//   }

//   const accessToken = `dev-fake-token-${foundUser.id}-${Date.now()}`;

//   const userPayload = {
//     id: foundUser.id,
//     email: foundUser.email,
//     firstName: foundUser.firstName,
//     lastName: foundUser.lastName,
//   };

//   return res.json({
//     user: userPayload,
//     roles: foundUser.roles,
//     accessToken,
//   });
// });

// // POST /api/v2/auth/refresh
// router.post("/refresh", (req, res) => {
//   // DEV ONLY: issue a new fake access token
//   const newAccessToken = `dev-fake-token-refresh-${Date.now()}`;

//   return res.json({
//     accessToken: newAccessToken,
//   });
// });


// module.exports = router;
const express = require("express");
const router = express.Router();

/**
 * TEMP fake users (DEV ONLY)
 */
const USERS = [
  {
    id: 1,
    email: "superadmin@calirocks.com",
    password: "password123",
    roles: [1],
    firstName: "Super",
    lastName: "Admin",
  },
  {
    id: 2,
    email: "admin@calirocks.com",
    password: "password123",
    roles: [2],
    firstName: "Main",
    lastName: "Admin",
  },
  {
    id: 3,
    email: "staff@calirocks.com",
    password: "password123",
    roles: [4],
    firstName: "Staff",
    lastName: "Member",
  },
];

// LOGIN → POST /api/v2/auth
router.post("/", (req, res) => {
  const { user, pwd } = req.body || {};

  if (!user || !pwd) {
    return res.status(400).json({ message: "user and pwd are required" });
  }

  const foundUser = USERS.find(
    (u) => u.email.toLowerCase() === String(user).toLowerCase()
  );

  if (!foundUser || foundUser.password !== pwd) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const accessToken = `dev-fake-token-${foundUser.id}-${Date.now()}`;

  return res.json({
    user: {
      id: foundUser.id,
      email: foundUser.email,
      firstName: foundUser.firstName,
      lastName: foundUser.lastName,
    },
    roles: foundUser.roles,
    accessToken,
  });
});

// REFRESH → POST /api/v2/auth/refresh
router.post("/refresh", (req, res) => {
  // DEV ONLY: issue a new fake access token
  const newAccessToken = `dev-fake-token-refresh-${Date.now()}`;

  // return previous user and roles (simulate session)
  return res.json({
    accessToken: newAccessToken,
    roles: req.body.roles || [2], // you can simulate
    user: req.body.user || { id: 2, email: "admin@calirocks.com", firstName: "Admin", lastName: "Admin" },
  });
});

module.exports = router;
