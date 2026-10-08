const express = require('express');
const router = express.Router();
const {
  createTrip,
  getTrips,
  getTripDetails,
  updateTrip,
  deleteTrip
} = require('../controllers/tripController');

router.route('/')
  .get(getTrips)
  .post(createTrip);

router.route('/:id')
  .get(getTripDetails)
  .put(updateTrip)
  .delete(deleteTrip);

module.exports = router;