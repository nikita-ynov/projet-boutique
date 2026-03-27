// controllers/users.js
const db = require('../config/db');

// GET /users — tous les utilisateurs (admin)
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /users/:id — un utilisateur (admin)
exports.getUserById = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, email, role, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (!users.length) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /users/:id/role — changer le rôle (admin)
exports.updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide' });
    }
    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    res.json({ message: 'Rôle mis à jour ✅' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /users/:id (admin)
exports.deleteUser = async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'Utilisateur supprimé 🗑️' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};