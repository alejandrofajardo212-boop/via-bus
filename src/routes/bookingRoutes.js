const express = require('express');
const router = express.Router();
const {
  createBooking,
  createManualBooking,
  getBookings,
  getTicketByCode,
  cancelBooking
} = require('../controllers/bookingController');

router.route('/')
  .get(getBookings)
  .post(createBooking);

// Venta manual de tramo intermedio (MNL-XXXXXX)
router.post('/manual', createManualBooking);

router.get('/ticket/:code', getTicketByCode);
router.get('/:code', getTicketByCode);
router.put('/:id/cancelar', cancelBooking);

module.exports = router;