const express = require('express');
const app = express();
const JWT = require('jsonwebtoken');
const UserStocks = require('./../../model/User_Stocks');

app.use(express.json());

const router = express.Router();

class PortfolioResponse {
    stock_id;
    stock_name;
    quantity_owned;

    constructor(stock_id, stock_name, quantity_owned) {
        this.stock_id = stock_id;
        this.stock_name = stock_name;
        this.quantity_owned = quantity_owned;
    }
}


router.post('/', async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    // const token = req.headers.token; // confirm this with Pratik bhaiya

    try {
        const decoded = JWT.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const userOwnedStocks = await UserStocks.find({ user_id: userId });

        const response = userOwnedStocks.map(stock => {
            return new PortfolioResponse(stock.stock_id, stock.stock_name, stock.quantity_owned);
        });

        res.status(200).json({
            "success": true,
            "data": response
        });
    } catch (error) {
        res.status(401).json({
            "success": false,
            "data": {
                "error": "There seems to be an error " + error
            }
        });
    }
});

module.exports = router;