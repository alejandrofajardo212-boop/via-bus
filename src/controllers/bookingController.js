const Booking = require('../models/booking');
const Trip = require('../models/trip');
const Customer = require('../models/customer');

// @desc    Comprar/Reservar un tiquete de bus (Venta)
// @route   POST /api/bookings o /api/ventas o /api/reservas
exports.createBooking = async (req, res) => {
  try {
    const {
      tripId,
      viajeId,
      seatNumber,
      puestoId,
      customerId,
      clienteId,
      customerName,
      customerDoc,
      nombre,
      documento,
      totalAmount,
      precio,
      notes,
      descripcion,
      saleDate,
      fechaVenta
    } = req.body;

    const finalTripId = viajeId || tripId;
    const finalSeatNumber = Number(puestoId !== undefined ? puestoId : seatNumber);

    // 1. Validar que el viaje exista
    const trip = await Trip.findById(finalTripId).populate('bus');
    if (!trip) {
      return res.status(404).json({ success: false, message: 'El viaje seleccionado no existe' });
    }

    // 2. Validar capacidad del bus
    const capacity = trip.bus ? (trip.bus.capacity || trip.bus.capacidad || 50) : 50;
    if (finalSeatNumber < 1 || finalSeatNumber > capacity) {
      return res.status(400).json({
        success: false,
        message: `El número de asiento ${finalSeatNumber} no es válido. Capacidad máxima: ${capacity}`
      });
    }

    // 3. Obtener nombre y documento reales del cliente (Soporta cliente seleccionado o digitado)
    let inputName = (customerName || nombre || '').trim();
    let inputDoc = (customerDoc || documento || '').trim();

    let finalCustomer = null;
    const lookupClientId = clienteId || customerId;

    if (lookupClientId && typeof lookupClientId === 'string' && lookupClientId.match(/^[0-9a-fA-F]{24}$/)) {
      finalCustomer = await Customer.findById(lookupClientId);
    }
    if (!finalCustomer && inputDoc) {
      finalCustomer = await Customer.findOne({ documento: inputDoc });
    }

    // Si se encontró el cliente en la base de datos, usar sus datos reales
    if (finalCustomer) {
      inputName = finalCustomer.nombre || finalCustomer.name || inputName;
      inputDoc = finalCustomer.documento || finalCustomer.document || inputDoc;
    } else if (inputDoc && inputName) {
      // Si es un cliente nuevo digitado en el formulario, registrarlo
      try {
        finalCustomer = await Customer.create({
          tipoDoc: 'CC',
          documento: inputDoc,
          nombre: inputName,
          telefono: '3100000000',
          correo: `cliente.${inputDoc.slice(-4)}@email.com`
        });
      } catch (e) {
        console.log('Cliente ya existente o registrado.');
      }
    }

    if (!inputName || !inputDoc) {
      return res.status(400).json({
        success: false,
        message: 'El nombre y documento del cliente son obligatorios'
      });
    }

    // 4. Validar que el puesto NO esté ocupado previamente
    const activeStatuses = ['Pagado', 'PAGADO', 'Confirmado', 'CONFIRMADO', 'CONFIRMED', 'Pendiente', 'PENDIENTE', 'Activo'];
    const existingActiveBooking = await Booking.findOne({
      trip: finalTripId,
      seatNumber: finalSeatNumber,
      status: { $in: activeStatuses }
    });

    if (existingActiveBooking) {
      return res.status(409).json({
        success: false,
        message: `El puesto #${finalSeatNumber} ya fue vendido para este viaje. Por favor seleccione otro asiento.`
      });
    }

    // 5. Generar código de tiquete único (Imposible de colisionar)
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const ticketCode = `TKT-${randomCode}`;

    // 6. Formatear fecha y monto
    let finalFechaVenta = fechaVenta || saleDate;
    if (!finalFechaVenta) {
      const now = new Date();
      finalFechaVenta = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }

    const finalAmount = Number(precio !== undefined ? precio : (totalAmount !== undefined ? totalAmount : trip.price));
    const finalNotes = descripcion || notes || '';

    // 7. Guardar venta como 'Confirmado'
    const booking = await Booking.create({
      ticketCode,
      trip: finalTripId,
      customer: finalCustomer ? finalCustomer._id : null,
      seatNumber: finalSeatNumber,
      customerName: inputName,
      customerDoc: inputDoc,
      totalAmount: finalAmount,
      notes: finalNotes,
      saleDate: finalFechaVenta,
      status: 'Confirmado'
    });

    // 8. BLOQUEAR EL ASIENTO EN EL MAPA DEL VIAJE
    await Trip.findByIdAndUpdate(finalTripId, {
      $addToSet: {
        occupiedSeats: finalSeatNumber,
        asientosOcupados: finalSeatNumber,
        puestosOcupados: finalSeatNumber
      }
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: 'trip',
        populate: { path: 'bus' }
      })
      .populate('customer');

    res.status(201).json({
      success: true,
      message: '¡Tiquete emitido con éxito!',
      data: populatedBooking
    });

  } catch (error) {
    console.error('Error al emitir tiquete:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Consultar historial de ventas/tiquetes
// @route   GET /api/bookings o /api/ventas o /api/reservas
exports.getBookings = async (req, res) => {
  try {
    const { doc, tripId, viajeId, status, estado } = req.query;
    let query = {};

    if (doc) query.customerDoc = doc.trim();
    const filterTrip = viajeId || tripId;
    if (filterTrip) query.trip = filterTrip;

    const filterStatus = estado || status;
    if (filterStatus) query.status = filterStatus;

    const bookings = await Booking.find(query)
      .populate({
        path: 'trip',
        populate: { path: 'bus' }
      })
      .populate('customer')
      .sort({ _id: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Consultar tiquete por código o ID
// @route   GET /api/bookings/:code
exports.getTicketByCode = async (req, res) => {
  try {
    const { code } = req.params;
    let booking = null;

    if (code.match(/^[0-9a-fA-F]{24}$/)) {
      booking = await Booking.findById(code).populate({
        path: 'trip',
        populate: { path: 'bus' }
      }).populate('customer');
    }

    if (!booking) {
      booking = await Booking.findOne({ ticketCode: code }).populate({
        path: 'trip',
        populate: { path: 'bus' }
      }).populate('customer');
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Tiquete no encontrado' });
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Cancelar una venta / tiquete
// @route   PUT /api/bookings/:id/cancelar o /api/ventas/:id/cancelar
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    let booking = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      booking = await Booking.findById(id);
    }
    if (!booking) {
      booking = await Booking.findOne({ ticketCode: id });
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Tiquete no encontrado' });
    }

    booking.status = 'Cancelado';
    await booking.save();

    if (booking.trip && booking.seatNumber) {
      await Trip.findByIdAndUpdate(booking.trip, {
        $pull: {
          occupiedSeats: booking.seatNumber,
          asientosOcupados: booking.seatNumber,
          puestosOcupados: booking.seatNumber
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tiquete cancelado exitosamente',
      data: booking
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}; 