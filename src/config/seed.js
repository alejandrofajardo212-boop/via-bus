const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./db');

const Bus = require('../models/bus');
const Customer = require('../models/customer');
const Trip = require('../models/trip');
const Booking = require('../models/booking');

function elementoAleatorio(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function enteroAleatorio(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const ciudades = [
  'Bogotá', 'Medellín', 'Cali', 'Bucaramanga', 'San Gil', 'Charalá', 
  'Socorro', 'Cartagena', 'Tunja', 'Pereira', 'Manizales', 'Armenia', 
  'Santa Marta', 'Cúcuta', 'Ibagué', 'Villavicencio'
];

const nombres = [
  'Camila', 'Juan', 'Valentina', 'David', 'Sandra', 'Carlos', 'Andrea', 'Mateo', 
  'Daniela', 'Felipe', 'Santiago', 'Sofia', 'Alejandro', 'Mariana', 'Sebastian', 
  'Natalia', 'Nicolas', 'Paula', 'Diego', 'Laura', 'Gabriel', 'Lucia', 'Julian', 'Isabella'
];

const apellidos = [
  'Restrepo', 'Salazar', 'Morales', 'Smith', 'Castro', 'López', 'Gómez', 'Martínez', 
  'Rojas', 'Rodríguez', 'Pérez', 'García', 'Vargas', 'Sánchez', 'Torres', 'Díaz', 
  'Suárez', 'Mendoza', 'Cortés', 'Ramírez'
];

const conductores = [
  'Carlos López', 'Andrés Gómez', 'Jorge Martínez', 'Hernán Silva', 'Wilson Pérez', 
  'Javier Rojas', 'Misterly Torres', 'Gonzalo Vargas', 'Orlando Ramírez'
];

const horarios = ['05:00', '06:30', '08:00', '09:30', '11:00', '13:00', '14:30', '16:00', '17:30', '19:00', '20:30', '22:00'];
const tiposDoc = ['CC', 'TI', 'CE'];
const tiposVehiculo = ['Bus', 'Buseta', 'Microbús'];
const estadosViaje = ['Disponible', 'Programado', 'Vendido'];

async function seedData() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await connectDB();
    console.log('--- Iniciando Carga Masiva Completa ViaBus ---');

    console.log('⏳ Limpiando colecciones anteriores...');
    await Booking.deleteMany({});
    await Trip.deleteMany({});
    await Bus.deleteMany({});
    await Customer.deleteMany({});
    console.log('✓ Colecciones limpiadas.');

    // 1. 200 Clientes
    console.log('⏳ Generando 200 clientes...');
    const clientes = [];
    for (let i = 1; i <= 200; i++) {
      const doc = `${1000000000 + i * 17}`;
      const nombreComp = `${elementoAleatorio(nombres)} ${elementoAleatorio(apellidos)}`;
      clientes.push({
        tipoDoc: elementoAleatorio(tiposDoc),
        documento: doc,
        nombre: nombreComp,
        telefono: `310${enteroAleatorio(1000000, 9999999)}`,
        correo: `cliente.${doc.slice(-4)}@email.com`,
        direccion: `Calle ${enteroAleatorio(1, 120)} # ${enteroAleatorio(1, 60)}-${enteroAleatorio(1, 99)}, ${elementoAleatorio(ciudades)}`
      });
    }
    const customerDocs = await Customer.insertMany(clientes);
    console.log(`✓ 200 Clientes registrados: ${customerDocs.length}`);

    // 2. 70 Buses
    console.log('⏳ Generando 70 vehículos/buses...');
    const buses = [];
    for (let i = 1; i <= 70; i++) {
      const tipo = elementoAleatorio(tiposVehiculo);
      const cap = tipo === 'Bus' ? 40 : tipo === 'Buseta' ? 20 : 12;
      const letras = String.fromCharCode(65 + enteroAleatorio(0, 25)) +
                     String.fromCharCode(65 + enteroAleatorio(0, 25)) +
                     String.fromCharCode(65 + enteroAleatorio(0, 25));
      const placa = `${letras}${enteroAleatorio(100, 999)}`;

      buses.push({
        tipo,
        plate: placa,
        numeroSerie: `BUS-${String(i).padStart(3, '0')}`,
        capacity: cap,
        driverName: elementoAleatorio(conductores),
        chassisSeries: `CHS-${enteroAleatorio(100000, 999999)}`,
        engineSeries: `MOT-${enteroAleatorio(100000, 999999)}`
      });
    }
    const busDocs = await Bus.insertMany(buses);
    console.log(`✓ 70 Vehículos registrados: ${busDocs.length}`);

    // 3. 50 Viajes
    console.log('⏳ Generando 50 viajes programados...');
    const viajes = [];
    for (let i = 1; i <= 50; i++) {
      const orig = elementoAleatorio(ciudades);
      let dest = elementoAleatorio(ciudades);
      while (dest === orig) dest = elementoAleatorio(ciudades);

      const dia = String(enteroAleatorio(10, 28)).padStart(2, '0');
      const bus = busDocs[i % busDocs.length];

      viajes.push({
        codigo: `VIA-${String(i).padStart(3, '0')}`,
        bus: bus._id,
        origin: orig,
        destination: dest,
        departureDate: `2026-10-${dia}`,
        departureTime: elementoAleatorio(horarios),
        price: enteroAleatorio(25, 85) * 1000,
        status: elementoAleatorio(estadosViaje),
        occupiedSeats: [],
        asientosOcupados: [],
        puestosOcupados: []
      });
    }
    const tripDocs = await Trip.insertMany(viajes);
    console.log(`✓ 50 Viajes registrados: ${tripDocs.length}`);

    // 4. 100 Ventas iniciales (status: 'Pagado')
    console.log('⏳ Registrando 100 tiquetes/ventas y ocupando asientos...');
    const ventas = [];
    const ocupacionPorViaje = {};

    for (let i = 1; i <= 100; i++) {
      const viaje = tripDocs[i % tripDocs.length];
      const cliente = customerDocs[i % customerDocs.length];
      
      if (!ocupacionPorViaje[viaje._id]) {
        ocupacionPorViaje[viaje._id] = new Set();
      }

      let seat = (i % 18) + 1;
      while (ocupacionPorViaje[viaje._id].has(seat)) {
        seat = (seat % 18) + 1;
      }
      ocupacionPorViaje[viaje._id].add(seat);

      ventas.push({
        ticketCode: `TKT-${String(i).padStart(3, '0')}`,
        trip: viaje._id,
        customer: cliente._id,
        customerName: cliente.nombre,
        customerDoc: cliente.documento,
        seatNumber: seat,
        totalAmount: viaje.price,
        saleDate: `2026-10-${String(1 + (i % 8)).padStart(2, '0')} ${elementoAleatorio(horarios)}`,
        status: 'Pagado'
      });
    }

    await Booking.insertMany(ventas);
    console.log('✓ 100 Ventas/Tiquetes creados.');

    // Sincronizar puestos ocupados en Trip
    for (const tripId of Object.keys(ocupacionPorViaje)) {
      const asientosArray = Array.from(ocupacionPorViaje[tripId]);
      await Trip.findByIdAndUpdate(tripId, {
        $set: {
          occupiedSeats: asientosArray,
          asientosOcupados: asientosArray,
          puestosOcupados: asientosArray
        }
      });
    }
    console.log('✓ Asientos ocupados sincronizados exitosamente en los viajes.');

    console.log('🎉 ¡PROCESO COMPLETADO! 200 Clientes, 70 Buses, 50 Viajes y 100 Ventas listos.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al sembrar datos:', err);
    process.exit(1);
  }
}

seedData();