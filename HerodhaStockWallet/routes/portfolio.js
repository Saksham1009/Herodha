const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const UserStocks = require('./../model/User_Stocks');

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

        const userOwnedStocks = await UserStocks.find({ user_id: userId });

        const response = userOwnedStocks.map(stock => {
            return new PortfolioResponse(stock.stock_id, stock.stock_name, stock.quantity_owned);
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