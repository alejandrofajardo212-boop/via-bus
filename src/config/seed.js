const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Bus = require('../models/bus');
const Customer = require('../models/customer');
const Trip = require('../models/trip');
const Booking = require('../models/booking');
const connectDB = require('./db');

dotenv.config();

async function seedData() {
  try {
    await connectDB();
    console.log('--- Iniciando Semilla de Datos ViaBus ---');

    // 1. Clientes
    const clientesIniciales = [
      {
        tipoDoc: 'CC',
        documento: '1020304050',
        nombre: 'María Camila Restrepo',
        telefono: '3104567890',
        correo: 'camila.restrepo@email.com',
        direccion: 'Calle 45 # 12-34, Bogotá'
      },
      {
        tipoDoc: 'CC',
        documento: '1030405060',
        nombre: 'Juan Pablo Salazar',
        telefono: '3157891234',
        correo: 'juan.salazar@email.com',
        direccion: 'Carrera 7 # 85-20, Bogotá'
      },
      {
        tipoDoc: 'TI',
        documento: '1098765432',
        nombre: 'Valentina Morales',
        telefono: '3201234567',
        correo: 'valen.morales@email.com',
        direccion: 'Calle 100 # 15-40, Medellín'
      },
      {
        tipoDoc: 'CE',
        documento: '45678912',
        nombre: 'David Robert Smith',
        telefono: '3009876543',
        correo: 'david.smith@email.com',
        direccion: 'Avenida El Dorado # 68-50, Bogotá'
      },
      {
        tipoDoc: 'CC',
        documento: '79845612',
        nombre: 'Sandra Milena Castro',
        telefono: '3123456789',
        correo: 'sandra.castro@email.com',
        direccion: 'Carrera 15 # 45-67, Cali'
      }
    ];

    const customerDocs = [];
    for (const c of clientesIniciales) {
      let doc = await Customer.findOne({ documento: c.documento });
      if (!doc) {
        doc = await Customer.create(c);
      }
      customerDocs.push(doc);
    }
    console.log(`✓ Clientes listos: ${customerDocs.length}`);

    // 2. Vehículos
    const vehiculosIniciales = [
      {
        tipo: 'Bus',
        plate: 'TRD459',
        numeroSerie: 'BUS-001',
        capacity: 40,
        driverName: 'Carlos Mario López',
        chassisSeries: 'CHS-987654',
        engineSeries: 'MOT-123456'
      },
      {
        tipo: 'Buseta',
        plate: 'MNL782',
        numeroSerie: 'BST-002',
        capacity: 20,
        driverName: 'Andrés Felipe Gómez',
        chassisSeries: 'CHS-654321',
        engineSeries: 'MOT-789012'
      },
      {
        tipo: 'Microbús',
        plate: 'QWE123',
        numeroSerie: 'MIC-003',
        capacity: 12,
        driverName: 'Jorge Iván Martínez',
        chassisSeries: 'CHS-112233',
        engineSeries: 'MOT-445566'
      }
    ];

    const busDocs = [];
    for (const v of vehiculosIniciales) {
      let doc = await Bus.findOne({ plate: v.plate });
      if (!doc) {
        doc = await Bus.create(v);
      }
      busDocs.push(doc);
    }
    console.log(`✓ Vehículos listos: ${busDocs.length}`);

    // 3. Viajes
    const viajesIniciales = [
      {
        codigo: 'VIA-001',
        bus: busDocs[0]._id,
        origin: 'Bogotá',
        destination: 'Medellín',
        departureDate: '2026-10-15',
        departureTime: '06:00',
        price: 85000,
        status: 'Disponible'
      },
      {
        codigo: 'VIA-002',
        bus: busDocs[1]._id,
        origin: 'Bogotá',
        destination: 'Cali',
        departureDate: '2026-10-16',
        departureTime: '08:30',
        price: 75000,
        status: 'Disponible'
      },
      {
        codigo: 'VIA-003',
        bus: busDocs[2]._id,
        origin: 'Medellín',
        destination: 'Cartagena',
        departureDate: '2026-10-18',
        departureTime: '14:00',
        price: 120000,
        status: 'Programado'
      }
    ];

    const tripDocs = [];
    for (const vj of viajesIniciales) {
      let doc = await Trip.findOne({ codigo: vj.codigo });
      if (!doc) {
        doc = await Trip.create(vj);
      }
      tripDocs.push(doc);
    }
    console.log(`✓ Viajes listos: ${tripDocs.length}`);

    // 4. Ventas
    const ventasIniciales = [
      {
        ticketCode: 'TKT-001',
        trip: tripDocs[0]._id,
        customer: customerDocs[0]._id,
        customerName: customerDocs[0].nombre,
        customerDoc: customerDocs[0].documento,
        seatNumber: 5,
        totalAmount: 85000,
        saleDate: '2026-10-01 10:30',
        status: 'Pagado'
      },
      {
        ticketCode: 'TKT-002',
        trip: tripDocs[0]._id,
        customer: customerDocs[1]._id,
        customerName: customerDocs[1].nombre,
        customerDoc: customerDocs[1].documento,
        seatNumber: 12,
        totalAmount: 85000,
        saleDate: '2026-10-01 14:15',
        status: 'Pagado'
      },
      {
        ticketCode: 'TKT-003',
        trip: tripDocs[1]._id,
        customer: customerDocs[2]._id,
        customerName: customerDocs[2].nombre,
        customerDoc: customerDocs[2].documento,
        seatNumber: 5,
        totalAmount: 75000,
        saleDate: '2026-10-02 09:00',
        status: 'Pagado'
      }
    ];

    for (const s of ventasIniciales) {
      const exists = await Booking.findOne({ ticketCode: s.ticketCode });
      if (!exists) {
        await Booking.create(s);
      }
    }
    console.log(`✓ Ventas/Tiquetes listos`);

    console.log('¡Semilla completada exitosamente!');
    process.exit(0);
  } catch (err) {
    console.error('Error al sembrar datos:', err);
    process.exit(1);
  }
}

seedData();
