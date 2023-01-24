const mongoose = require('mongoose');
const OrderSchema = mongoose.Schema(
  {
    order_number: { type: String, unique: true },
    stripeOrderNumber: { type: String, select: false },
    orderDetails: Object,
    client_reference_id: { type: String, select: false },
    subTotal: Number,
    total: Number,
    total_metadata: Object,
    metadata: { type: Object, select: false },
    customerInfo: { type: Object },
    shipping_info: { type: Object },
    status: String,
    user_DB_KEY: { type: String, select: false },
    // product
  },
  { timestamp: true }
);
const Order = mongoose.model('Order', OrderSchema, 'orders');
module.exports = Order;
