const Bus = require('../models/bus');

// @desc    Registrar un nuevo bus/vehículo
// @route   POST /api/buses o /api/vehiculos
exports.createBus = async (req, res) => {
  try {
    const {
      company,
      plate,
      placa,
      driverName,
      conductor,
      capacity,
      capacidad,
      tipo,
      vehicleType,
      numeroSerie,
      serialNumber,
      chassisSeries,
      serieChasis,
      engineSeries,
      serieMotor,
      puestos
    } = req.body;

    const finalPlate = (placa || plate || '').trim().toUpperCase();
    const finalDriver = (conductor || driverName || '').trim();
    const finalCapacity = Number(capacidad || capacity || 20);
    const finalTipo = tipo || vehicleType || 'Bus';
    const finalSerie = (numeroSerie || serialNumber || '').trim();
    const finalChassis = (serieChasis || chassisSeries || 'N/A').trim();
    const finalEngine = (serieMotor || engineSeries || 'N/A').trim();

    if (!finalPlate) {
      return res.status(400).json({ success: false, message: 'La placa es obligatoria' });
    }
    if (!finalDriver) {
      return res.status(400).json({ success: false, message: 'El conductor es obligatorio' });
    }

    const existingBus = await Bus.findOne({ plate: finalPlate });
    if (existingBus) {
      return res.status(400).json({ success: false, message: 'Ya existe un vehículo registrado con esa placa' });
    }

    // Generar puestos si no vienen
    let finalPuestos = puestos;
    if (!finalPuestos || finalPuestos.length === 0) {
      finalPuestos = [];
      for (let i = 1; i <= finalCapacity; i++) {
        finalPuestos.push({ id: i, numero: i, esConductor: false, disponible: true });
      }
    }

    const newBus = await Bus.create({
      company: company || 'Via Bus Express',
      tipo: finalTipo,
      plate: finalPlate,
      numeroSerie: finalSerie,
      driverName: finalDriver,
      capacity: finalCapacity,
      chassisSeries: finalChassis,
      engineSeries: finalEngine,
      puestos: finalPuestos
    });

    res.status(201).json({
      success: true,
      message: 'Vehículo registrado correctamente',
      data: newBus
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Obtener todos los buses/vehículos
// @route   GET /api/buses o /api/vehiculos
exports.getBuses = async (req, res) => {
  try {
    const buses = await Bus.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: buses.length, data: buses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Obtener un vehículo por ID
// @route   GET /api/buses/:id o /api/vehiculos/:id
exports.getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Vehículo no encontrado' });
    }
    res.status(200).json({ success: true, data: bus });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Actualizar un vehículo o sus puestos
// @route   PUT /api/buses/:id o /api/vehiculos/:id
exports.updateBus = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.placa) updateData.plate = updateData.placa.toUpperCase();
    if (updateData.conductor) updateData.driverName = updateData.conductor;
    if (updateData.capacidad) updateData.capacity = Number(updateData.capacidad);
    if (updateData.serieChasis) updateData.chassisSeries = updateData.serieChasis;
    if (updateData.serieMotor) updateData.engineSeries = updateData.serieMotor;

    const bus = await Bus.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Vehículo no encontrado' });
    }

    res.status(200).json({
      success: true,
      message: 'Vehículo actualizado correctamente',
      data: bus
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Actualizar asiento del conductor
// @route   PUT /api/buses/:id/conductor-puesto o /api/vehiculos/:id/conductor-puesto
exports.updateDriverSeat = async (req, res) => {
  try {
    const { puestoId } = req.body;
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Vehículo no encontrado' });
    }

    bus.puestos.forEach(p => {
      p.esConductor = (p.id === Number(puestoId) || p.numero === Number(puestoId));
    });

    await bus.save();
    res.status(200).json({
      success: true,
      message: 'Puesto del conductor actualizado',
      data: bus
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Eliminar un vehículo
// @route   DELETE /api/buses/:id o /api/vehiculos/:id
exports.deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Vehículo no encontrado' });
    }
    res.status(200).json({ success: true, message: 'Vehículo eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};