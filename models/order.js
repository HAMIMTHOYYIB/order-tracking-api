const mongoose = require('mongoose')
const orderSchema = new mongoose.Schema({
  consignee_phone: { type: String, required: true },
  awb_number: { type: String, required: true },
  product_detail: { type: Array, required: true },
  consignee_name: { type: String, required: true },
  courier_service: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);