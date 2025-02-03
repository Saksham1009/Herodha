const mongoose = require('mongoose');


const UserStocksSchema = new mongoose.Schema({

    stock_id: {
        type: mongoose.Schema.Types.ObjectId, //references '_id' of Stock
        ref: 'Stock',
        required: true
    },

    user_id: {
        type: mongoose.Schema.Types.ObjectId, //references '_id' of User
        ref: 'User', 
        required: true
    }, 

    quantity_owned: {
        type: Number, 
        required: true, 
        min: 0
    }, 

    updated_at: {
        type: Date, 
        required: true, 
        default: Date.now
    }
});

module.exports = mongoose.model('User_Stocks', UserStocksSchema);