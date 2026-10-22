const express = require('express');
const router = express.Router();
const {
  loginUser,
  registerUser,
  getUsers
} = require('../controllers/authController');

// POST /api/auth/login       → triple validación (email + username + password)
router.post('/login', loginUser);

// POST /api/auth/register    → crear nuevo operador / administrador
router.post('/register', registerUser);

// GET  /api/auth/usuarios    → listar todos los usuarios (sin contraseñas)
router.get('/usuarios', getUsers);

module.exports = router;
