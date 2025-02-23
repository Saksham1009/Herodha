const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const StockTx = require('./../model/Stock_Tx');

app.use(express.json());

const router = express.Router();

class StockTxResponse {
    stock_tx_id;
    parent_stock_tx_id;
    stock_id;
    wallet_tx_id;
    order_status;
    is_buy;
    order_type;

    constructor(stock_tx_id, parent_stock_tx_id, stock_id, wallet_tx_id, order_status, is_buy, order_type) {
        this.stock_tx_id = stock_tx_id;
        this.parent_stock_tx_id = parent_stock_tx_id;
        this.stock_id = stock_id;
        this.wallet_tx_id = wallet_tx_id;
        this.order_status = order_status;
        this.is_buy = is_buy;
        this.order_type = order_type;
    }
}

// Extract Credentials using custom header 'token'
const extractCredentials = (req) => {
    const token = req.headers.token; // Using custom header 'token'
    if (!token) {
        return null;
    }
    const decoded = jwt.decode(token); // Directly decode the token without splitting
    return decoded;
};


router.get('/', async (req, res) => {
    try {
        const userId = extractCredentials(req).userId;

        const userStockTx = await StockTx.find({ user_id: userId });

        const response = userStockTx.map(stocktx => {
            return {
                "stock_tx_id": stocktx._id,
                "parent_stock_tx_id": stocktx.parent_stock_tx_id ? stocktx.parent_stock_tx_id.toString() : null,
                "stock_id": stocktx.stock_id,
                "wallet_tx_id": stocktx.wallet_tx_id ? stocktx.wallet_tx_id.toString() : null,
                "order_status": stocktx.order_status,
                "is_buy": stocktx.is_buy,
                "order_type": stocktx.order_type,
                "stock_price": stocktx.stock_price,
                "quantity": stocktx.quantity,
                "time_stamp": stocktx.time_stamp
            }
        });

        return res.status(200).json({
            "success": true,
            "data": response
        });
    } catch (error) {
        return res.status(401).json({
            "success": false,
            "data": {
                "error": "There seems to be an error " + error
            }
        });
    }
});

module.exports = router;