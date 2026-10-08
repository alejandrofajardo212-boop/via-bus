const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Bus = require('../models/bus');
const Customer = require('../models/customer');
const Trip = require('../models/trip');
const Booking = require('../models/booking');
const connectDB = require('./db');

dotenv.config();

// Listas auxiliares para la generación dinámica de datos
const ciudades = ['Bogotá', 'Medellín', 'Cali', 'Bucaramanga', 'San Gil', 'Charalá', 'Socorro', 'Cartagena', 'Tunja', 'Pereira'];
const nombres = ['Camila', 'Juan', 'Valentina', 'David', 'Sandra', 'Carlos', 'Andrea', 'Mateo', 'Daniela', 'Felipe'];
const apellidos = ['Restrepo', 'Salazar', 'Morales', 'Smith', 'Castro', 'López', 'Gómez', 'Martínez', 'Rojas', 'Rodríguez'];
const conductores = ['Carlos López', 'Andrés Gómez', 'Jorge Martínez', 'Hernán Silva', 'Wilson Pérez', 'Javier Rojas'];
const tiposDoc = ['CC', 'TI', 'CE'];
const tiposVehiculo = ['Bus', 'Buseta', 'Microbús'];
const estadosViaje = ['Disponible', 'Programado', 'Vendido'];

async function seedData() {
  try {
    await connectDB();
    console.log('--- Iniciando Semilla de Datos ViaBus ---');

    // 0. Limpieza previa de colecciones existentes
    console.log('⏳ Limpiando base de datos previa...');
    await Booking.deleteMany({});
    await Trip.deleteMany({});
    await Bus.deleteMany({});
    await Customer.deleteMany({});
    console.log('✓ Colecciones limpiadas correctamente.');

    // 1. Generación de 200 Clientes
    console.log('⏳ Generando 200 clientes...');
    const clientesIniciales = [];
    for (let i = 1; i <= 200; i++) {
      const nombreRand = nombres[i % nombres.length];
      const apellidoRand = apellidos[(i * 3) % apellidos.length];
      clientesIniciales.push({
        tipoDoc: tiposDoc[i % tiposDoc.length],
        documento: `${1000000000 + i}`,
        nombre: `${nombreRand} ${apellidoRand}`,
        telefono: `310${String(1000000 + i).slice(-7)}`,
        correo: `cliente${i}@email.com`,
        direccion: `Calle ${1 + (i % 100)} # ${10 + (i % 50)}-${i % 20}, ${ciudades[i % ciudades.length]}`
      });
    }
    const customerDocs = await Customer.insertMany(clientesIniciales);
    console.log(`✓ Clientes listos: ${customerDocs.length}`);

    // 2. Generación de 70 Vehículos (Buses)
    console.log('⏳ Generando 70 vehículos...');
    const vehiculosIniciales = [];
    for (let i = 1; i <= 70; i++) {
      const tipo = tiposVehiculo[i % tiposVehiculo.length];
      const cap = tipo === 'Bus' ? 40 : tipo === 'Buseta' ? 20 : 12;
      const letraPlaca = String.fromCharCode(65 + (i % 26)) + String.fromCharCode(65 + ((i + 2) % 26)) + String.fromCharCode(65 + ((i + 5) % 26));
      const numPlaca = String(100 + i);

      vehiculosIniciales.push({
        tipo,
        plate: `${letraPlaca}${numPlaca}`,
        numeroSerie: `BUS-${String(i).padStart(3, '0')}`,
        capacity: cap,
        driverName: conductores[i % conductores.length],
        chassisSeries: `CHS-${900000 + i}`,
        engineSeries: `MOT-${100000 + i}`
      });
    }
    const busDocs = await Bus.insertMany(vehiculosIniciales);
    console.log(`✓ Vehículos listos: ${busDocs.length}`);

    // 3. Generación de 50 Viajes Programados
    console.log('⏳ Generando 50 viajes...');
    const viajesIniciales = [];
    for (let i = 1; i <= 50; i++) {
      const origen = ciudades[i % ciudades.length];
      let destino = ciudades[(i + 3) % ciudades.length];
      if (origen === destino) destino = ciudades[(i + 4) % ciudades.length];

      viajesIniciales.push({
        codigo: `VIA-${String(i).padStart(3, '0')}`,
        bus: busDocs[i % busDocs.length]._id,
        origin: origen,
        destination: destino,
        departureDate: `2026-10-${String(10 + (i % 20)).padStart(2, '0')}`,
        departureTime: `${String(6 + (i % 14)).padStart(2, '0')}:00`,
        price: 25000 + (i * 1000),
        status: estadosViaje[i % estadosViaje.length]
      });
    }
    const tripDocs = await Trip.insertMany(viajesIniciales);
    console.log(`✓ Viajes listos: ${tripDocs.length}`);

    // 4. Generación de 100 Ventas / Tiquetes
    console.log('⏳ Generando 100 tiquetes...');
    const ventasIniciales = [];
    for (let i = 1; i <= 100; i++) {
      const viaje = tripDocs[i % tripDocs.length];
      const cliente = customerDocs[i % customerDocs.length];

      ventasIniciales.push({
        ticketCode: `TKT-${String(i).padStart(3, '0')}`,
        trip: viaje._id,
        customer: cliente._id,
        customerName: cliente.nombre,
        customerDoc: cliente.documento,
        seatNumber: (i % 20) + 1,
        totalAmount: viaje.price,
        saleDate: `2026-10-${String(1 + (i % 8)).padStart(2, '0')} 10:00`,
        status: 'Pagado'
      });
    }
    await Booking.insertMany(ventasIniciales);
    console.log(`✓ Ventas/Tiquetes listos: 100`);

    console.log('¡Semilla completada exitosamente sin afectar esquemas existentes!');
    process.exit(0);
  } catch (err) {
    console.error('Error al sembrar datos:', err);
    process.exit(1);
  }
}

seedData();