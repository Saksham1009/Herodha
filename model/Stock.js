const mongoose = require('mongoose');

const StockCollection = new mongoose.Schema({
    stock_name: {
        type: String, 
        required: true
    },
    time_stamp: { 
        type: Date, 
        required: true, 
        default: Date.now
    }
});

module.exports = mongoose.model('Stock', StockCollection);