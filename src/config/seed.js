const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Bus = require('../models/bus');
const Customer = require('../models/customer');
const Trip = require('../models/trip');
const Booking = require('../models/booking');
const connectDB = require('./db');

dotenv.config();

// Funciones auxiliares para aleatoriedad
function elementoAleatorio(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function enteroAleatorio(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Bancos de datos ampliados para alta variabilidad
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
    await connectDB();
    console.log('--- Iniciando Semilla de Datos Aleatorios ViaBus ---');

    // 0. Limpieza previa de la base de datos
    console.log('⏳ Limpiando colecciones anteriores...');
    await Booking.deleteMany({});
    await Trip.deleteMany({});
    await Bus.deleteMany({});
    await Customer.deleteMany({});
    console.log('✓ Colecciones limpiadas.');

    // 1. Generación de 200 Clientes Únicos
    console.log('⏳ Generando 200 clientes únicos...');
    const clientesIniciales = [];
    const nombresUsados = new Set();

    for (let i = 1; i <= 200; i++) {
      let nombreCompleto = '';
      do {
        nombreCompleto = `${elementoAleatorio(nombres)} ${elementoAleatorio(apellidos)}`;
      } while (nombresUsados.has(nombreCompleto) && nombresUsados.size < 400);

      nombresUsados.add(nombreCompleto);

      const docNum = 1000000000 + i * 37 + enteroAleatorio(1, 9);
      clientesIniciales.push({
        tipoDoc: elementoAleatorio(tiposDoc),
        documento: `${docNum}`,
        nombre: nombreCompleto,
        telefono: `310${enteroAleatorio(1000000, 9999999)}`,
        correo: `cliente.${docNum.toString().slice(-4)}@email.com`,
        direccion: `Calle ${enteroAleatorio(1, 120)} # ${enteroAleatorio(1, 60)}-${enteroAleatorio(1, 99)}, ${elementoAleatorio(ciudades)}`
      });
    }
    const customerDocs = await Customer.insertMany(clientesIniciales);
    console.log(`✓ Clientes generados: ${customerDocs.length}`);

    // 2. Generación de 70 Vehículos (Buses)
    console.log('⏳ Generando 70 vehículos...');
    const vehiculosIniciales = [];
    const placasUsadas = new Set();

    for (let i = 1; i <= 70; i++) {
      const tipo = elementoAleatorio(tiposVehiculo);
      const cap = tipo === 'Bus' ? 40 : tipo === 'Buseta' ? 20 : 12;
      
      let placa = '';
      do {
        const letras = String.fromCharCode(65 + enteroAleatorio(0, 25)) +
                       String.fromCharCode(65 + enteroAleatorio(0, 25)) +
                       String.fromCharCode(65 + enteroAleatorio(0, 25));
        placa = `${letras}${enteroAleatorio(100, 999)}`;
      } while (placasUsadas.has(placa));

      placasUsadas.add(placa);

      vehiculosIniciales.push({
        tipo,
        plate: placa,
        numeroSerie: `BUS-${String(i).padStart(3, '0')}`,
        capacity: cap,
        driverName: elementoAleatorio(conductores),
        chassisSeries: `CHS-${enteroAleatorio(100000, 999999)}`,
        engineSeries: `MOT-${enteroAleatorio(100000, 999999)}`
      });
    }
    const busDocs = await Bus.insertMany(vehiculosIniciales);
    console.log(`✓ Vehículos generados: ${busDocs.length}`);

    // 3. Generación de 50 Viajes Totalmente Variados
    console.log('⏳ Generando 50 viajes variados...');
    const viajesIniciales = [];

    for (let i = 1; i <= 50; i++) {
      const origen = elementoAleatorio(ciudades);
      let destino = elementoAleatorio(ciudades);
      while (destino === origen) {
        destino = elementoAleatorio(ciudades);
      }

      const dia = enteroAleatorio(10, 28);
      const mes = '10'; // Octubre
      const busAsignado = elementoAleatorio(busDocs);

      viajesIniciales.push({
        codigo: `VIA-${String(i).padStart(3, '0')}`,
        bus: busAsignado._id,
        origin: origen,
        destination: destino,
        departureDate: `2026-${mes}-${String(dia).padStart(2, '0')}`,
        departureTime: elementoAleatorio(horarios),
        price: enteroAleatorio(20, 85) * 1000,
        status: elementoAleatorio(estadosViaje)
      });
    }
    const tripDocs = await Trip.insertMany(viajesIniciales);
    console.log(`✓ Viajes generados: ${tripDocs.length}`);

    // 4. Generación de 100 Ventas / Tiquetes Variados
    console.log('⏳ Generando 100 tiquetes...');
    const ventasIniciales = [];

    for (let i = 1; i <= 100; i++) {
      const viaje = elementoAleatorio(tripDocs);
      const cliente = elementoAleatorio(customerDocs);

      ventasIniciales.push({
        ticketCode: `TKT-${String(i).padStart(3, '0')}`,
        trip: viaje._id,
        customer: cliente._id,
        customerName: cliente.nombre,
        customerDoc: cliente.documento,
        seatNumber: enteroAleatorio(1, 20),
        totalAmount: viaje.price,
        saleDate: `2026-10-${String(enteroAleatorio(1, 9)).padStart(2, '0')} ${elementoAleatorio(horarios)}`,
        status: 'Pagado'
      });
    }
    await Booking.insertMany(ventasIniciales);
    console.log(`✓ Tiquetes generados: 100`);

    console.log('🎉 ¡Carga masiva aleatoria completada exitosamente!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al sembrar datos:', err);
    process.exit(1);
  }
}

seedData();