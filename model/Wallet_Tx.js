const mongoose = require('mongoose');

const WalletTransactions = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    stock_tx_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Stock_Tx",
        required: false
    },
    is_debit: {
        type: Boolean,
        required: true
    },
    amount: {
        type: mongoose.Types.Decimal128,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    }
});

module.exports = mongoose.Model('Wallet_Tx', WalletTransactions);