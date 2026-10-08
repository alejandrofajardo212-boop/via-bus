const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookings,
  getTicketByCode,
  cancelBooking
} = require('../controllers/bookingController');

router.route('/')
  .get(getBookings)
  .post(createBooking);

router.get('/ticket/:code', getTicketByCode);
router.get('/:code', getTicketByCode);
router.put('/:id/cancelar', cancelBooking);

module.exports = router;