const express = require('express');
const router = express.Router();
const {
  createBus,
  getBuses,
  getBusById,
  updateBus,
  updateDriverSeat,
  deleteBus
} = require('../controllers/busController');

router.route('/')
  .get(getBuses)
  .post(createBus);

router.route('/:id')
  .get(getBusById)
  .put(updateBus)
  .delete(deleteBus);

router.put('/:id/conductor-puesto', updateDriverSeat);

module.exports = router;