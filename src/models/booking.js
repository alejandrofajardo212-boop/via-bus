const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  ticketCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: [true, 'El viaje es obligatorio']
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  seatNumber: {
    type: Number,
    required: [true, 'El número de asiento es obligatorio']
  },
  customerName: {
    type: String,
    required: [true, 'El nombre del cliente es obligatorio'],
    trim: true
  },
  customerDoc: {
    type: String,
    required: [true, 'El documento del cliente es obligatorio'],
    trim: true
  },
  totalAmount: {
    type: Number,
    required: [true, 'El valor del tiquete es obligatorio']
  },
  origin: {
    type: String,
    trim: true,
    default: ''
  },
  destination: {
    type: String,
    trim: true,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  saleDate: {
    type: String,
    default: ''
  },
  // ─── Campos de Venta Manual ─────────────────────────────────────────────────
  isManual: {
    type: Boolean,
    default: false
  },
  manualOrigin: {
    type: String,
    trim: true,
    default: ''
  },
  manualDestination: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pagado', 'Pendiente', 'Cancelado'],
    default: 'Pagado'
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret.ticketCode || (ret._id ? ret._id.toString() : '');
      ret._dbId = ret._id ? ret._id.toString() : '';
      ret.puestoId = ret.seatNumber;
      ret.precio = ret.totalAmount;
      ret.descripcion = ret.notes;
      ret.fechaVenta = ret.saleDate;
      ret.estado = ret.status;
      if (ret.trip && ret.trip._id) {
        ret.viajeId = ret.trip._id.toString();
      } else if (ret.trip) {
        ret.viajeId = ret.trip.toString();
      }
      if (ret.customer && ret.customer._id) {
        ret.clienteId = ret.customer._id.toString();
      } else if (ret.customer) {
        ret.clienteId = ret.customer.toString();
      }
      return ret;
    }
  }
});

// Índice compuesto para evitar doble reserva del mismo asiento en el mismo viaje
bookingSchema.index({ trip: 1, seatNumber: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);