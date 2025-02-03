const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


const WalletTransactions = new mongoose.Schema({
    user_id: {
        type: ObjectId,
        ref: "User",
        required: true
    },
    stock_tx_id: {
        type: ObjectId,
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
        default: Date.now,
    }
});

module.exports = mongoose.Model('Wallet_Tx', WalletTransactions);