const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  codigo: {
    type: String,
    unique: true,
    trim: true
  },
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: [true, 'Debe asignar un bus al viaje']
  },
  origin: {
    type: String,
    required: [true, 'La ciudad de origen es obligatoria'],
    trim: true
  },
  destination: {
    type: String,
    required: [true, 'La ciudad de destino es obligatoria'],
    trim: true
  },
  departureDate: {
    type: String,
    required: [true, 'La fecha del viaje es obligatoria (YYYY-MM-DD)']
  },
  departureTime: {
    type: String,
    required: [true, 'La hora de salida es obligatoria (HH:MM)']
  },
  price: {
    type: Number,
    required: [true, 'El valor del tiquete es obligatorio'],
    min: [0, 'El precio no puede ser negativo']
  },
  imageUrl: {
    type: String,
    default: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80'
  },
  status: {
    type: String,
    default: 'Programado'
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id ? ret._id.toString() : ret.id;
      ret.origen = ret.origin;
      ret.destino = ret.destination;
      ret.fecha = ret.departureDate;
      ret.hora = ret.departureTime;
      ret.precio = ret.price;
      ret.estado = ret.status;
      if (ret.bus && ret.bus._id) {
        ret.vehiculoId = ret.bus._id.toString();
      } else if (ret.bus) {
        ret.vehiculoId = ret.bus.toString();
      }
      return ret;
    }
  }
});

module.exports = mongoose.model('Trip', tripSchema);