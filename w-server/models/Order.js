const mongoose = require('mongoose');

const OrderSchema = mongoose.Schema({
  date: {type: Date, default: Date.now},
  status: {type: String, default: 'created'}, // 'token bouthg', 'completed', 'failed'
  token_name: String,
  whole_eth_amount: Number,
  percent: Number,
  contract_address: String,
  cost: Number
});

module.exports = mongoose.model('Order', OrderSchema);