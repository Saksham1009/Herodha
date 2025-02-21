/*
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
*/
/*
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

const extractCredentials = (req) => {
    const token = req.header('Authorization');
    if (!token) {
        return null;
    }
    const decoded = jwt.decode(token.split(' ')[1]);
    return decoded;
}

// Changed from router.post to router.get
router.get('/', async (req, res) => {
    try {
        const userId = extractCredentials(req).userId;

        if (!userId) {
            return res.status(401).json({
                "success": false,
                "data": "Unauthorized: No valid token provided."
            });
        }

        const userOwnedStocks = await UserStocks.find({ user_id: userId });

        const response = userOwnedStocks.map(stock => {
            return new PortfolioResponse(stock.stock_id, stock.stock_name, stock.quantity_owned);
        });

        return res.status(200).json({
            "success": true,
            "data": response
        });
    } catch (error) {
        return res.status(500).json({
            "success": false,
            "data": {
                "error": "There seems to be an error " + error
            }
        });
    }
});

module.exports = router;
*/

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

const extractCredentials = (req) => {
    const token = req.header('Authorization');
    if (!token) {
        return null;
    }
    const decoded = jwt.decode(token.split(' ')[1]);
    return decoded;
}

router.get('/', async (req, res) => {
    try {

        const userId = extractCredentials(req).userId;

        if (!userId) {
            res.status(401).json({
                "success": false,
                "data": "Unauthorized: No valid token provided."
            });
            return;
        }

        const userOwnedStocks = await UserStocks.find({ user_id: userId });

        const response = userOwnedStocks.map(stock => {
            return new PortfolioResponse(stock.stock_id, stock.stock_name, stock.quantity_owned);
        });

        res.status(200).json({
            "success": true,
            "data": response
        });
    } catch (error) {
        res.status(500).json({
            "success": false,
            "data": {
                "error": "There seems to be an error " + error
            }
        });
    }
});

module.exports = router;
