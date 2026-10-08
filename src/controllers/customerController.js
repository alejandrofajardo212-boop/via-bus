const Customer = require('../models/customer');

// @desc    Registrar un nuevo cliente
// @route   POST /api/clientes
exports.createCustomer = async (req, res) => {
  try {
    const { tipoDoc, documento, nombre, telefono, correo, direccion } = req.body;

    if (!documento || !nombre) {
      return res.status(400).json({
        success: false,
        message: 'El documento y el nombre son obligatorios'
      });
    }

    const existingCustomer = await Customer.findOne({
      documento: documento.trim()
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Este documento ya está registrado'
      });
    }

    const newCustomer = await Customer.create({
      tipoDoc: tipoDoc || 'CC',
      documento: documento.trim(),
      nombre: nombre.trim(),
      telefono: (telefono || '').trim(),
      correo: (correo || '').trim().toLowerCase(),
      direccion: (direccion || '').trim()
    });

    res.status(201).json({
      success: true,
      message: 'Cliente registrado exitosamente',
      data: newCustomer
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Este documento ya está registrado'
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Obtener todos los clientes con opción de búsqueda
// @route   GET /api/clientes
exports.getCustomers = async (req, res) => {
  try {
    const { search, doc } = req.query;
    let query = {};

    if (doc) {
      query.documento = doc.trim();
    } else if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query = {
        $or: [
          { documento: regex },
          { nombre: regex },
          { correo: regex }
        ]
      };
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Obtener un cliente por ID o Documento
// @route   GET /api/clientes/:id
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    let customer = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      customer = await Customer.findById(id);
    }

    if (!customer) {
      customer = await Customer.findOne({ documento: id });
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Actualizar datos de un cliente
// @route   PUT /api/clientes/:id
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cliente actualizado correctamente',
      data: customer
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Eliminar un cliente
// @route   DELETE /api/clientes/:id
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cliente eliminado correctamente'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Verificar si existe un documento
// @route   GET /api/clientes/existe/:doc
exports.checkDocument = async (req, res) => {
  try {
    const exists = await Customer.exists({ documento: req.params.doc.trim() });
    res.status(200).json({ success: true, exists: !!exists });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
