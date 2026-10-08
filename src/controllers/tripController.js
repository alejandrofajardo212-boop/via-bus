const Trip = require('../models/trip');
const Booking = require('../models/booking');
const Bus = require('../models/bus');

// @desc    Programar un nuevo viaje
// @route   POST /api/trips o /api/viajes
exports.createTrip = async (req, res) => {
  try {
    const {
      codigo,
      code,
      bus,
      vehiculoId,
      origin,
      origen,
      destination,
      destino,
      departureDate,
      fecha,
      departureTime,
      hora,
      price,
      precio,
      imageUrl,
      status,
      estado
    } = req.body;

    const finalOrigin = (origen || origin || '').trim();
    const finalDest = (destino || destination || '').trim();
    const finalBusId = vehiculoId || bus;
    const finalDate = fecha || departureDate;
    const finalTime = hora || departureTime;
    const finalPrice = Number(precio !== undefined ? precio : price);
    const finalStatus = estado || status || 'Programado';

    if (!finalOrigin || !finalDest) {
      return res.status(400).json({ success: false, message: 'Origen y destino son obligatorios' });
    }

    if (finalOrigin.toLowerCase() === finalDest.toLowerCase()) {
      return res.status(400).json({ success: false, message: 'El origen y el destino no pueden ser la misma ciudad' });
    }

    if (!finalBusId) {
      return res.status(400).json({ success: false, message: 'Debe asignar un vehículo al viaje' });
    }

    // Generar código si no viene
    let finalCode = (codigo || code || '').trim();
    if (!finalCode) {
      const count = await Trip.countDocuments();
      finalCode = `VIA-${String(count + 1).padStart(3, '0')}`;
    }

    const newTrip = await Trip.create({
      codigo: finalCode,
      bus: finalBusId,
      origin: finalOrigin,
      destination: finalDest,
      departureDate: finalDate,
      departureTime: finalTime,
      price: finalPrice,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
      status: finalStatus
    });

    const populated = await Trip.findById(newTrip._id).populate('bus');

    res.status(201).json({
      success: true,
      message: 'Viaje programado con éxito',
      data: populated
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Listar viajes con filtros opcionales
// @route   GET /api/trips o /api/viajes
exports.getTrips = async (req, res) => {
  try {
    const { origin, destination, origen, destino } = req.query;
    let query = {};

    const searchOrigin = origen || origin;
    const searchDest = destino || destination;

    if (searchOrigin) query.origin = new RegExp(searchOrigin, 'i');
    if (searchDest) query.destination = new RegExp(searchDest, 'i');

    const trips = await Trip.find(query).populate('bus').sort({ departureDate: 1, departureTime: 1 });

    // Calcular cupos disponibles en tiempo real
    const tripsWithOccupancy = await Promise.all(
      trips.map(async (trip) => {
        const occupiedCount = await Booking.countDocuments({
          trip: trip._id,
          status: { $in: ['CONFIRMED', 'Pagado'] }
        });
        const capacity = trip.bus ? trip.bus.capacity : 0;
        const freeSeats = Math.max(0, capacity - occupiedCount);

        const obj = trip.toJSON ? trip.toJSON() : trip.toObject();
        return {
          ...obj,
          occupiedSeats: occupiedCount,
          freeSeats: freeSeats
        };
      })
    );

    res.status(200).json({
      success: true,
      count: tripsWithOccupancy.length,
      data: tripsWithOccupancy
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Obtener detalle de un viaje con su mapa de asientos
// @route   GET /api/trips/:id o /api/viajes/:id
exports.getTripDetails = async (req, res) => {
  try {
    const { id } = req.params;
    let trip = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      trip = await Trip.findById(id).populate('bus');
    }
    if (!trip) {
      trip = await Trip.findOne({ codigo: id }).populate('bus');
    }

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Viaje no encontrado' });
    }

    // Obtener reservas activas
    const bookings = await Booking.find({
      trip: trip._id,
      status: { $in: ['CONFIRMED', 'Pagado'] }
    }).select('seatNumber customerName customerDoc ticketCode');

    const occupiedSeatsList = bookings.map(b => b.seatNumber);
    const capacity = trip.bus ? trip.bus.capacity : 0;

    res.status(200).json({
      success: true,
      data: {
        trip,
        occupiedSeats: occupiedSeatsList,
        freeSeatsCount: Math.max(0, capacity - occupiedSeatsList.length),
        bookings
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Actualizar un viaje (ej. estado)
// @route   PUT /api/trips/:id o /api/viajes/:id
exports.updateTrip = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.origen) updateData.origin = updateData.origen;
    if (updateData.destino) updateData.destination = updateData.destino;
    if (updateData.fecha) updateData.departureDate = updateData.fecha;
    if (updateData.hora) updateData.departureTime = updateData.hora;
    if (updateData.precio !== undefined) updateData.price = Number(updateData.precio);
    if (updateData.estado) updateData.status = updateData.estado;
    if (updateData.vehiculoId) updateData.bus = updateData.vehiculoId;

    const trip = await Trip.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('bus');
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Viaje no encontrado' });
    }

    res.status(200).json({
      success: true,
      message: 'Viaje actualizado correctamente',
      data: trip
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Eliminar un viaje
// @route   DELETE /api/trips/:id o /api/viajes/:id
exports.deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Viaje no encontrado' });
    }
    res.status(200).json({ success: true, message: 'Viaje eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};