/**
 * ViaBus — Script de Carga Masiva (seed.js)
 * ─────────────────────────────────────────
 * Ejecutar: node src/config/seed.js
 *
 * Genera:
 *   - 3  usuarios predefinidos (SuperAdmin, Administrador, Oficina)
 *   - 200 clientes
 *   - 70  buses
 *   - 50  viajes
 *   - 100 tiquetes/ventas (status: 'Pagado') + asientos ocupados en Trip
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const dotenv   = require('dotenv');

dotenv.config();

// ─── Importar conexión ANTES de usarla ────────────────────────────────────────
const connectDB = require('./db');

// ─── Modelos ──────────────────────────────────────────────────────────────────
const User     = require('../models/user');
const Bus      = require('../models/bus');
const Customer = require('../models/customer');
const Trip     = require('../models/trip');
const Booking  = require('../models/booking');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ─── Datos base ───────────────────────────────────────────────────────────────
const ciudades = [
  'Bogotá', 'Medellín', 'Cali', 'Bucaramanga', 'San Gil', 'Charalá',
  'Socorro', 'Cartagena', 'Tunja', 'Pereira', 'Manizales', 'Armenia',
  'Santa Marta', 'Cúcuta', 'Ibagué', 'Villavicencio', 'Pasto', 'Neiva',
  'Montería', 'Barranquilla'
];

const nombres = [
  'Camila', 'Juan', 'Valentina', 'David', 'Sandra', 'Carlos', 'Andrea', 'Mateo',
  'Daniela', 'Felipe', 'Santiago', 'Sofia', 'Alejandro', 'Mariana', 'Sebastian',
  'Natalia', 'Nicolas', 'Paula', 'Diego', 'Laura', 'Gabriel', 'Lucia', 'Julian',
  'Isabella', 'Tomás', 'Valeria', 'Andrés', 'Catalina', 'Ricardo', 'Melissa'
];

const apellidos = [
  'Restrepo', 'Salazar', 'Morales', 'Smith', 'Castro', 'López', 'Gómez', 'Martínez',
  'Rojas', 'Rodríguez', 'Pérez', 'García', 'Vargas', 'Sánchez', 'Torres', 'Díaz',
  'Suárez', 'Mendoza', 'Cortés', 'Ramírez', 'Herrera', 'Ríos', 'Cardona', 'Ospina'
];

const conductores = [
  'Carlos López', 'Andrés Gómez', 'Jorge Martínez', 'Hernán Silva', 'Wilson Pérez',
  'Javier Rojas', 'Misterly Torres', 'Gonzalo Vargas', 'Orlando Ramírez',
  'Efraín Suárez', 'Fredy Cortés', 'Mauricio Herrera', 'Alirio Ríos'
];

const horarios    = ['05:00','06:30','08:00','09:30','11:00','13:00','14:30','16:00','17:30','19:00','20:30','22:00'];
const tiposDoc    = ['CC', 'TI', 'CE'];
const tiposVeh    = ['Bus', 'Buseta', 'Microbús'];
const estadosViaje = ['Disponible', 'Programado', 'Vendido'];

// ─────────────────────────────────────────────────────────────────────────────
async function seedData() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await connectDB();
    console.log('✅ Conexión establecida.\n');
    console.log('━━━ INICIANDO CARGA MASIVA ViaBus ━━━\n');

    // ── 0. Limpiar colecciones ─────────────────────────────────────────────
    console.log('🗑  Limpiando colecciones...');
    await Booking.deleteMany({});
    await Trip.deleteMany({});
    await Bus.deleteMany({});
    await Customer.deleteMany({});
    await User.deleteMany({});
    console.log('✓  Todas las colecciones limpiadas.\n');

    // ── 1. Usuarios predeterminados (contraseñas hasheadas con bcryptjs) ───
    console.log('👤 Insertando 3 usuarios predeterminados...');
    const SALT_ROUNDS = 12;

    const usuariosBase = [
      {
        nombre:   'Super Administrador Global',
        email:    'superadmin@viabus.com',
        username: 'superadmin',
        password: await bcrypt.hash('SuperAdmin2026*', SALT_ROUNDS),
        rol:      'SuperAdmin',
        activo:   true
      },
      {
        nombre:   'Administrador de Flota',
        email:    'admin@viabus.com',
        username: 'admin',
        password: await bcrypt.hash('Admin2026*', SALT_ROUNDS),
        rol:      'Administrador',
        activo:   true
      },
      {
        nombre:   'Operador de Taquilla',
        email:    'oficina@viabus.com',
        username: 'oficina',
        password: await bcrypt.hash('Oficina2026*', SALT_ROUNDS),
        rol:      'Oficina',
        activo:   true
      }
    ];

    // Insertar directamente en la colección para omitir el pre('save') del modelo
    // (ya hicimos el hash manualmente arriba) → usar insertMany con { validateBeforeSave: false }
    // NOTA: Como el hash ya está hecho, usamos Model.collection.insertMany para saltarnos
    // el middleware pre-save (que volvería a hashear la contraseña ya hasheada).
    await User.collection.insertMany(usuariosBase);
    console.log('✓  3 Usuarios predeterminados insertados.\n');

    // ── 2. 200 Clientes ────────────────────────────────────────────────────
    console.log('👥 Generando 200 clientes...');
    const clientes = [];
    for (let i = 1; i <= 200; i++) {
      const doc = `${1000000000 + i * 17}`;
      clientes.push({
        tipoDoc:   pick(tiposDoc),
        documento: doc,
        nombre:    `${pick(nombres)} ${pick(apellidos)}`,
        telefono:  `310${randInt(1000000, 9999999)}`,
        correo:    `cliente${i}.${doc.slice(-4)}@email.com`,
        direccion: `Calle ${randInt(1, 120)} # ${randInt(1, 60)}-${randInt(1, 99)}, ${pick(ciudades)}`
      });
    }
    const customerDocs = await Customer.insertMany(clientes);
    console.log(`✓  ${customerDocs.length} Clientes insertados.\n`);

    // ── 3. 70 Buses ────────────────────────────────────────────────────────
    console.log('🚌 Generando 70 buses...');
    const placasUsadas = new Set();
    const buses = [];

    for (let i = 1; i <= 70; i++) {
      const tipo = pick(tiposVeh);
      const cap  = tipo === 'Bus' ? 40 : tipo === 'Buseta' ? 20 : 12;

      let placa;
      do {
        const letras = String.fromCharCode(65 + randInt(0, 25)) +
                       String.fromCharCode(65 + randInt(0, 25)) +
                       String.fromCharCode(65 + randInt(0, 25));
        placa = `${letras}${randInt(100, 999)}`;
      } while (placasUsadas.has(placa));
      placasUsadas.add(placa);

      buses.push({
        tipo,
        plate:        placa,
        numeroSerie:  `BUS-${String(i).padStart(3, '0')}`,
        capacity:     cap,
        driverName:   pick(conductores),
        chassisSeries:`CHS-${randInt(100000, 999999)}`,
        engineSeries: `MOT-${randInt(100000, 999999)}`
      });
    }
    const busDocs = await Bus.insertMany(buses);
    console.log(`✓  ${busDocs.length} Buses insertados.\n`);

    // ── 4. 50 Viajes ───────────────────────────────────────────────────────
    console.log('🗺  Generando 50 viajes...');
    const viajes = [];
    for (let i = 1; i <= 50; i++) {
      const orig = pick(ciudades);
      let dest;
      do { dest = pick(ciudades); } while (dest === orig);

      const dia = String(randInt(10, 28)).padStart(2, '0');
      const bus = busDocs[i % busDocs.length];

      viajes.push({
        codigo:        `VIA-${String(i).padStart(3, '0')}`,
        bus:           bus._id,
        origin:        orig,
        destination:   dest,
        departureDate: `2026-10-${dia}`,
        departureTime: pick(horarios),
        price:         randInt(25, 85) * 1000,
        status:        pick(estadosViaje),
        occupiedSeats: [],
        asientosOcupados: [],
        puestosOcupados:  []
      });
    }
    const tripDocs = await Trip.insertMany(viajes);
    console.log(`✓  ${tripDocs.length} Viajes insertados.\n`);

    // ── 5. 100 Tiquetes / Ventas (status: 'Pagado') ─────────────────────────
    console.log('🎫 Generando 100 tiquetes con asientos ocupados...');
    const ventas = [];
    const ocupacionPorViaje = {};   // { tripId → Set<seatNumber> }

    for (let i = 1; i <= 100; i++) {
      const viaje   = tripDocs[i % tripDocs.length];
      const cliente = customerDocs[i % customerDocs.length];

      const tripKey = viaje._id.toString();
      if (!ocupacionPorViaje[tripKey]) {
        ocupacionPorViaje[tripKey] = new Set();
      }

      // Buscar asiento libre dentro del rango 1-18 (sin colisión en el mismo viaje)
      let seat = (i % 18) + 1;
      let guard = 0;
      while (ocupacionPorViaje[tripKey].has(seat) && guard < 40) {
        seat = (seat % 18) + 1;
        guard++;
      }
      // Si todos los asientos del rango están ocupados, usar un número mayor
      if (ocupacionPorViaje[tripKey].has(seat)) {
        seat = ocupacionPorViaje[tripKey].size + 19;
      }
      ocupacionPorViaje[tripKey].add(seat);

      ventas.push({
        ticketCode:   `TKT-${String(i).padStart(3, '0')}`,
        trip:         viaje._id,
        customer:     cliente._id,
        customerName: cliente.nombre,
        customerDoc:  cliente.documento,
        seatNumber:   seat,
        totalAmount:  viaje.price,
        origin:       viaje.origin,
        destination:  viaje.destination,
        saleDate:     `2026-10-${String(1 + (i % 8)).padStart(2, '0')} ${pick(horarios)}`,
        status:       'Pagado'   // ← siempre valor del enum permitido
      });
    }

    await Booking.insertMany(ventas);
    console.log(`✓  ${ventas.length} Tiquetes insertados.\n`);

    // ── 6. Sincronizar occupiedSeats en cada Trip ──────────────────────────
    console.log('🔄 Sincronizando asientos ocupados en los viajes...');
    for (const [tripId, asientosSet] of Object.entries(ocupacionPorViaje)) {
      const asientosArray = Array.from(asientosSet);
      await Trip.findByIdAndUpdate(tripId, {
        $set: {
          occupiedSeats:    asientosArray,
          asientosOcupados: asientosArray,
          puestosOcupados:  asientosArray
        }
      });
    }
    console.log('✓  Asientos ocupados sincronizados en todos los viajes.\n');

    console.log('🎉 ¡CARGA MASIVA COMPLETADA EXITOSAMENTE!');
    console.log('   • 3   Usuarios  (SuperAdmin / Administrador / Oficina)');
    console.log(`   • ${customerDocs.length}  Clientes`);
    console.log(`   • ${busDocs.length}   Buses`);
    console.log(`   • ${tripDocs.length}   Viajes`);
    console.log(`   • ${ventas.length}  Tiquetes (status: Pagado)\n`);

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error durante la carga masiva:', err);
    process.exit(1);
  }
}

seedData();