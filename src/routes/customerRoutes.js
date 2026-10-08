const express = require('express');
const router = express.Router();
const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  checkDocument
} = require('../controllers/customerController');

router.route('/')
  .get(getCustomers)
  .post(createCustomer);

router.get('/existe/:doc', checkDocument);

router.route('/:id')
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

module.exports = router;
