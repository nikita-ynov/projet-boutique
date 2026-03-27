// router/users.js
const express    = require('express');
const router     = express.Router();
const auth       = require('../middleware/auth');
const adminAuth  = require('../middleware/adminAuth');
const { getAllUsers, getUserById, updateRole, deleteUser } = require('../controllers/users');

router.get('/users',           auth, adminAuth, getAllUsers);
router.get('/users/:id',       auth, adminAuth, getUserById);
router.put('/users/:id/role',  auth, adminAuth, updateRole);
router.delete('/users/:id',    auth, adminAuth, deleteUser);

module.exports = router;