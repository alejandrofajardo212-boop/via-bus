const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  tipoDoc: {
    type: String,
    enum: ['CC', 'TI', 'CE', 'PP', 'NIT'],
    default: 'CC',
    required: [true, 'El tipo de documento es obligatorio']
  },
  documento: {
    type: String,
    required: [true, 'El número de documento es obligatorio'],
    unique: true,
    trim: true
  },
  nombre: {
    type: String,
    required: [true, 'El nombre completo es obligatorio'],
    trim: true
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es obligatorio'],
    trim: true
  },
  correo: {
    type: String,
    required: [true, 'El correo electrónico es obligatorio'],
    trim: true,
    lowercase: true
  },
  direccion: {
    type: String,
    required: [true, 'La dirección es obligatoria'],
    trim: true
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id ? ret._id.toString() : ret.id;
      return ret;
    }
  }
});

module.exports = mongoose.model('Customer', customerSchema);
