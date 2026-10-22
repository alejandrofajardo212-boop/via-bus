const User = require('../models/user');
const jwt = require('jsonwebtoken');

// ─── Helper: generar JWT ──────────────────────────────────────────────────────
const generateToken = (id, rol) => {
  return jwt.sign(
    { id, rol },
    process.env.JWT_SECRET || 'viabus_secret_key_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
};

// ─── Helper: respuesta segura del usuario (sin contraseña) ───────────────────
const safeUser = (user) => ({
  _id:      user._id,
  id:       user._id,
  nombre:   user.nombre,
  email:    user.email,
  username: user.username,
  rol:      user.rol,
  activo:   user.activo
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Iniciar sesión  (triple validación: email + username + password)
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.loginUser = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Validar que los tres campos estén presentes
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Los campos email, username y password son obligatorios para iniciar sesión'
      });
    }

    // Buscar por email Y username simultáneamente (triple validación en un solo query)
    const user = await User.findOne({
      email:    email.toLowerCase().trim(),
      username: username.toLowerCase().trim(),
      activo:   true
    }).select('+password'); // traer password para comparar

    // Si no coinciden email + username, o si no existe → 401
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas. Verifica tu correo, nombre de usuario y contraseña.'
      });
    }

    // Verificar la contraseña (tercer factor)
    const passwordOk = await user.matchPassword(password);
    if (!passwordOk) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas. Verifica tu correo, nombre de usuario y contraseña.'
      });
    }

    const token = generateToken(user._id, user.rol);

    return res.status(200).json({
      success: true,
      message: `Bienvenido, ${user.nombre}`,
      token,
      user: safeUser(user)
    });

  } catch (error) {
    console.error('Error en loginUser:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Registrar nuevo usuario/operador
// @route   POST /api/auth/register
// @access  SuperAdmin / Administrador (proteger en producción con middleware)
// ─────────────────────────────────────────────────────────────────────────────
exports.registerUser = async (req, res) => {
  try {
    const { nombre, email, username, password, rol } = req.body;

    if (!nombre || !email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Los campos nombre, email, username y password son obligatorios'
      });
    }

    // Verificar unicidad de email
    const emailExistente = await User.findOne({ email: email.toLowerCase().trim() });
    if (emailExistente) {
      return res.status(409).json({
        success: false,
        message: `El correo ${email} ya está registrado`
      });
    }

    // Verificar unicidad de username
    const usernameExistente = await User.findOne({ username: username.toLowerCase().trim() });
    if (usernameExistente) {
      return res.status(409).json({
        success: false,
        message: `El nombre de usuario "${username}" ya está en uso`
      });
    }

    const rolesValidos = ['SuperAdmin', 'Administrador', 'Oficina'];
    const rolFinal = rolesValidos.includes(rol) ? rol : 'Oficina';

    const user = await User.create({
      nombre: nombre.trim(),
      email:  email.toLowerCase().trim(),
      username: username.toLowerCase().trim(),
      password,
      rol: rolFinal
    });

    const token = generateToken(user._id, user.rol);

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token,
      user: safeUser(user)
    });

  } catch (error) {
    // Manejar errores de unicidad de Mongoose
    if (error.code === 11000) {
      const campo = Object.keys(error.keyValue)[0];
      return res.status(409).json({
        success: false,
        message: `El campo "${campo}" ya existe en el sistema`
      });
    }
    console.error('Error en registerUser:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Listar todos los usuarios (sin contraseñas)
// @route   GET /api/auth/usuarios  o  GET /api/usuarios
// @access  SuperAdmin / Administrador
// ─────────────────────────────────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    // El campo password tiene select: false en el esquema → nunca viene por defecto
    const users = await User.find({}).sort({ rol: 1, nombre: 1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error en getUsers:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
