const mongoose = require('mongoose');
const ObjectIdType = mongoose.Schema.Types.ObjectId;

const StockTxCollection = new mongoose.Schema({
    stock_id: {
        type: ObjectIdType, //references '_id' of Stock
        ref: 'Stock',
        required: true
    },
    user_id: {
        type: ObjectIdType, //references '_id' of User
        ref: 'User',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    stock_price: {
        type: Number,
        required: true
    },
    is_buy: {
        type: Boolean,
        required: true
    },
    time_stamp: {
        type: Date,
        required: true,
        default: Date.now
    },
    parent_stock_tx_id: {
        type: ObjectIdType, //references '_id' of Stock_Tx
        ref: 'Stock_Tx',
        required: false
    },
    order_status: {
        type: String,
        enum: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'PARTIALLY_COMPLETE'],
        required: true
    },
    wallet_tx_id: {
        type: ObjectIdType, //references '_id' of Wallet_Tx
        ref: 'Wallet_Tx',
        required: false
    },
    order_type: {
        type: String,
        enum: ['MARKET', 'LIMIT'],
        required: true
    }
});

module.exports = mongoose.model('Stock_Tx', StockTxCollection);