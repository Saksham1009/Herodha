const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const UserStocksCollection = new mongoose.Schema({
    stock_id: {
        type: ObjectId, //references '_id' of Stock
        ref: 'Stock',
        required: true
    },
    stock_name: {
        type: String,
        required: true
    },
    user_id: {
        type: ObjectId, //references '_id' of User
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
        default: Date.now()
    }
});

module.exports = mongoose.model('User_Stocks', UserStocksCollection);