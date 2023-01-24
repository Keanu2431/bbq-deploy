const express = require('express');
const router = express.Router();
const orderController = require('./../controllers/orderController');

router.route('/checkout').get(orderController.getCheckout);
router.route('/').get(orderController.getOrder);
router.route('/order-query').get(orderController.getOrderQuery);
module.exports = router;
