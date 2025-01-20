const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Secret key for JWT
const JWT_SECRET = "your-secret-key";

// Middleware
app.use(bodyParser.json());
app.use(express.static("public")); // Serve HTML files from the "public" folder

// Simulating a database with JSON files
const USERS_DB = "users.json";
const INVITE_CODES_DB = "inviteCodes.json";

// Utility to read/write user data
const getUsers = () => {
  if (!fs.existsSync(USERS_DB)) return [];
  const data = fs.readFileSync(USERS_DB);
  return JSON.parse(data);
};

const saveUsers = (users) => {
  fs.writeFileSync(USERS_DB, JSON.stringify(users, null, 2));
};

// Utility to read/write invite codes
const getInviteCodes = () => {
  if (!fs.existsSync(INVITE_CODES_DB)) return [];
  const data = fs.readFileSync(INVITE_CODES_DB);
  return JSON.parse(data);
};

const saveInviteCodes = (codes) => {
  fs.writeFileSync(INVITE_CODES_DB, JSON.stringify(codes, null, 2));
};

// Generate a new invite code (for admin to create invite codes)
app.post("/generate-invite-code", (req, res) => {
  const inviteCodes = getInviteCodes();
  const newCode = Math.random().toString(36).substring(2, 10); // Random invite code
  inviteCodes.push(newCode);
  saveInviteCodes(inviteCodes);
  res.json({ inviteCode: newCode });
});

// Register a new user
app.post("/register", async (req, res) => {
  const { username, password, inviteCode } = req.body;

  // Check if the invite code is valid
  const inviteCodes = getInviteCodes();
  if (!inviteCodes.includes(inviteCode)) {
    return res.status(400).json({ error: "Invalid invite code" });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if username already exists
  const users = getUsers();
  const userExists = users.find(user => user.username === username);
  if (userExists) {
    return res.status(400).json({ error: "User already exists" });
  }

  // Add new user to the database
  const newUser = { username, password: hashedPassword };
  users.push(newUser);
  saveUsers(users);

  // Generate JWT token
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1h" });

  res.json({ message: "Registration successful", token });
});

// Login the user
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const users = getUsers();

  const user = users.find(u => u.username === username);
  if (!user) return res.status(400).json({ error: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: "Invalid password" });

  // Generate JWT token
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ message: "Login successful", token });
});

// Middleware to verify JWT token for protected routes
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ error: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = decoded;
    next();
  });
};

// Protected dashboard route
app.get("/dashboard", verifyToken, (req, res) => {
  res.json({ message: `Welcome to the dashboard, ${req.user.username}` });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
