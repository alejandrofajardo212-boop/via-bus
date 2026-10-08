const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  numero: { type: Number, required: true },
  esConductor: { type: Boolean, default: false },
  disponible: { type: Boolean, default: true }
}, { _id: false });

const busSchema = new mongoose.Schema({
  company: {
    type: String,
    default: 'Via Bus Express'
  },
  tipo: {
    type: String,
    enum: ['Bus', 'Buseta', 'Microbús'],
    default: 'Bus'
  },
  plate: {
    type: String,
    required: [true, 'La placa del bus es obligatoria'],
    unique: true,
    uppercase: true,
    trim: true
  },
  numeroSerie: {
    type: String,
    default: ''
  },
  driverName: {
    type: String,
    required: [true, 'El nombre del conductor es obligatorio'],
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'La capacidad de asientos es obligatoria'],
    min: [1, 'La capacidad mínima debe ser de al menos 1 asiento']
  },
  chassisSeries: {
    type: String,
    default: 'N/A'
  },
  engineSeries: {
    type: String,
    default: 'N/A'
  },
  puestos: [seatSchema]
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id ? ret._id.toString() : ret.id;
      ret.placa = ret.plate;
      ret.conductor = ret.driverName;
      ret.capacidad = ret.capacity;
      ret.serieChasis = ret.chassisSeries;
      ret.serieMotor = ret.engineSeries;
      return ret;
    }
  }
});

// Auto-generar puestos si no se proporcionan
busSchema.pre('save', function () {
  if (!this.puestos || this.puestos.length === 0) {
    const total = this.capacity || 20;
    const lista = [];
    for (let i = 1; i <= total; i++) {
      lista.push({ id: i, numero: i, esConductor: false, disponible: true });
    }
    this.puestos = lista;
  }
});

module.exports = mongoose.model('Bus', busSchema);