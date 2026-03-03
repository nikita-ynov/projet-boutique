const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


// ======================
// REGISTER
// ======================
exports.registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    // Check if user exists
    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Utilisateur déjà existant" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await db.query(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [email, hashedPassword]
    );

    const token = jwt.sign(
      { id: result.insertId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    res.status(201).json({
      message: "Utilisateur créé 🎉",
      token
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ======================
// LOGIN
// ======================
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect" });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    res.json({
      message: "Connexion réussie ✅",
      token
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ======================
// GET PROFILE
// ======================
exports.userProfile = async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, email, role, created_at FROM users WHERE id = ?",
      [req.user.id]
    );

    res.json(users[0]);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};