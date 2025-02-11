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

const extractCredentials = (req) => {
    const token = req.header('Authorization');
    if (!token) {
        return null;
    }
    const decoded = jwt.decode(token.split(' ')[1]);
    return decoded;
}

router.post('/', async (req, res) => {
    try {
        const userId = extractCredentials(req).userId;

        const userStockTx = await StockTx.find({ user_id: userId });

        const response = userStockTx.map(stockTx => {
            return new StockTxResponse(
                stockTx._id,
                stockTx.parent_stock_tx_id,
                stockTx.stock_id,
                stockTx.wallet_tx_id,
                stockTx.order_status,
                stockTx.is_buy,
                stockTx.order_type
            );
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