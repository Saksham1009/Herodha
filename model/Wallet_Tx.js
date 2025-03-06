const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


const WalletTxCollection = new mongoose.Schema({
    user_id: {
        type: ObjectId, //references '_id' of User
        ref: "User",
        required: true
    },
    stock_tx_id: {
        type: ObjectId, //references '_id' of Stock_Tx
        ref: "Stock_Tx",
        required: false
    },
    is_debit: {
        type: Boolean,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    time_stamp: {
        type: Date,
        required: true,
        default: Date.now
    }
});

module.exports = mongoose.model('Wallet_Tx', WalletTxCollection);