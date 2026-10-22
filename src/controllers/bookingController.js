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

    // 2. Obtener cliente seleccionado o datos digitados
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

    if (finalCustomer) {
      inputName = finalCustomer.nombre || finalCustomer.name || inputName;
      inputDoc = finalCustomer.documento || finalCustomer.document || inputDoc;
    } else if (inputDoc && inputName) {
      try {
        finalCustomer = await Customer.create({
          tipoDoc: 'CC',
          documento: inputDoc,
          nombre: inputName,
          telefono: '3100000000',
          correo: `cliente.${inputDoc.slice(-4)}@email.com`
        });
      } catch (e) {
        finalCustomer = await Customer.findOne({ documento: inputDoc });
      }
    }

    if (!inputName || !inputDoc) {
      return res.status(400).json({
        success: false,
        message: 'El nombre y documento del cliente son obligatorios'
      });
    }

    // 3. Generar CÓDIGO ÚNICO GARANTIZADO
    let ticketCode = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 20) {
      attempts++;
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      ticketCode = `TKT-${randomNum}`;
      const existing = await Booking.findOne({ ticketCode });
      if (!existing) isUnique = true;
    }

    // 4. Formatear fecha y monto
    let finalFechaVenta = fechaVenta || saleDate;
    if (!finalFechaVenta) {
      const now = new Date();
      finalFechaVenta = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }

    const finalAmount = Number(precio !== undefined ? precio : (totalAmount !== undefined ? totalAmount : trip.price));
    const finalNotes = descripcion || notes || '';

    // 5. Guardar la venta en MongoDB Atlas como 'Pagado' (valor enum válido)
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
      status: 'Pagado'
    });

    // 6. REGISTRAR PUESTO OCUPADO EN EL VIAJE
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

    return res.status(201).json({
      success: true,
      message: '¡Tiquete emitido con éxito!',
      data: populatedBooking
    });

  } catch (error) {
    console.error('Error al emitir tiquete:', error);
    return res.status(500).json({ success: false, error: error.message });
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

// @desc    Venta manual de tramo intermedio (ej: aborda en Bucaramanga, baja en Tunja)
// @route   POST /api/bookings/manual  o  /api/ventas/manual
exports.createManualBooking = async (req, res) => {
  try {
    const {
      tripId, viajeId,
      seatNumber, puestoId,
      customerId, clienteId,
      customerName, nombre,
      customerDoc, documento,
      precioManual, totalAmount, precio,
      origenManual, destinoManual,
      notes, descripcion,
      saleDate, fechaVenta
    } = req.body;

    const finalTripId     = viajeId || tripId;
    const finalSeatNumber = Number(puestoId !== undefined ? puestoId : seatNumber);

    // ── 1. Validar que el viaje exista ──────────────────────────────────────
    if (!finalTripId) {
      return res.status(400).json({ success: false, message: 'El tripId / viajeId es obligatorio' });
    }
    const trip = await Trip.findById(finalTripId).populate('bus');
    if (!trip) {
      return res.status(404).json({ success: false, message: 'El viaje seleccionado no existe' });
    }

    // ── 2. Validar disponibilidad del asiento ───────────────────────────────
    if (!finalSeatNumber || isNaN(finalSeatNumber)) {
      return res.status(400).json({ success: false, message: 'El número de asiento es obligatorio' });
    }

    const occupiedInTrip = [
      ...(trip.occupiedSeats    || []),
      ...(trip.asientosOcupados || []),
      ...(trip.puestosOcupados  || [])
    ];
    if (occupiedInTrip.includes(finalSeatNumber)) {
      return res.status(409).json({
        success: false,
        message: `El asiento ${finalSeatNumber} ya está ocupado en este viaje`
      });
    }

    // Verificar en Bookings (fuente de verdad)
    const conflicto = await Booking.findOne({
      trip: finalTripId,
      seatNumber: finalSeatNumber,
      status: { $ne: 'Cancelado' }
    });
    if (conflicto) {
      return res.status(409).json({
        success: false,
        message: `El asiento ${finalSeatNumber} ya tiene una reserva activa en este viaje`
      });
    }

    // ── 3. Resolver cliente ─────────────────────────────────────────────────
    let inputName = (customerName || nombre || '').trim();
    let inputDoc  = (customerDoc  || documento || '').trim();
    let finalCustomer = null;

    const lookupClientId = clienteId || customerId;
    if (lookupClientId && typeof lookupClientId === 'string' && lookupClientId.match(/^[0-9a-fA-F]{24}$/)) {
      finalCustomer = await Customer.findById(lookupClientId);
    }
    if (!finalCustomer && inputDoc) {
      finalCustomer = await Customer.findOne({ documento: inputDoc });
    }
    if (finalCustomer) {
      inputName = finalCustomer.nombre || inputName;
      inputDoc  = finalCustomer.documento || inputDoc;
    }

    if (!inputName || !inputDoc) {
      return res.status(400).json({
        success: false,
        message: 'El nombre y documento del pasajero son obligatorios para la venta manual'
      });
    }

    // ── 4. Generar código MNL-XXXXXX único (anti-colisión) ──────────────────
    let ticketCode = '';
    let isUnique   = false;
    let attempts   = 0;

    while (!isUnique && attempts < 20) {
      attempts++;
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      ticketCode = `MNL-${randomNum}`;
      const existing = await Booking.findOne({ ticketCode });
      if (!existing) isUnique = true;
    }

    if (!isUnique) {
      return res.status(500).json({
        success: false,
        message: 'No se pudo generar un código único. Intente nuevamente.'
      });
    }

    // ── 5. Fecha y monto ────────────────────────────────────────────────────
    let finalFechaVenta = fechaVenta || saleDate;
    if (!finalFechaVenta) {
      const now = new Date();
      finalFechaVenta = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }

    const finalAmount = Number(
      precioManual !== undefined ? precioManual :
      precio       !== undefined ? precio       :
      totalAmount  !== undefined ? totalAmount  :
      trip.price
    );

    const manualOrigen  = (origenManual  || trip.origin     || '').trim();
    const manualDestino = (destinoManual || trip.destination || '').trim();
    const finalNotes    = (descripcion   || notes            || '').trim();

    // ── 6. Crear la venta manual en BD ──────────────────────────────────────
    const booking = await Booking.create({
      ticketCode,
      trip:              finalTripId,
      customer:          finalCustomer ? finalCustomer._id : null,
      seatNumber:        finalSeatNumber,
      customerName:      inputName,
      customerDoc:       inputDoc,
      totalAmount:       finalAmount,
      origin:            manualOrigen,
      destination:       manualDestino,
      notes:             finalNotes,
      saleDate:          finalFechaVenta,
      status:            'Pagado',
      isManual:          true,
      manualOrigin:      manualOrigen,
      manualDestination: manualDestino
    });

    // ── 7. Bloquear asiento en el Trip ($addToSet evita duplicados) ─────────
    await Trip.findByIdAndUpdate(finalTripId, {
      $addToSet: {
        occupiedSeats:    finalSeatNumber,
        asientosOcupados: finalSeatNumber,
        puestosOcupados:  finalSeatNumber
      }
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate({ path: 'trip', populate: { path: 'bus' } })
      .populate('customer');

    return res.status(201).json({
      success:  true,
      message:  `¡Venta manual emitida! Código: ${ticketCode}`,
      isManual: true,
      data:     populatedBooking
    });

  } catch (error) {
    console.error('Error en createManualBooking:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};