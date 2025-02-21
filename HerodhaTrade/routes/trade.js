const express = require('express');
const router = express.Router();
const Stock = require('./../model/Stock');
const Stock_Tx = require('./../model/Stock_Tx');
const Wallet_Tx = require('./../model/Wallet_Tx');
const User_Stocks = require('./../model/User_Stocks');
const User = require('./../model/User');
const jwt = require('jsonwebtoken');
const amqp = require('amqplib');
const axios = require('axios');

const extractCredentials = (req) => {
    const token = req.header('Authorization');
    if (!token) {
        return null;
    }
    const decoded = jwt.decode(token.split(' ')[1]);
    return decoded;
}

var connection = null;
var channel = null;

async function initRabbitMQ() {
    try {
        const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq';
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertQueue('buy_orders', { durable: true });
        await channel.assertQueue('sell_orders', { durable: true });
        await channel.assertQueue('cancel_orders', { durable: true });
        console.log('RabbitMQ connection and channel initialized');
    } catch (err) {
        console.error('Error initializing RabbitMQ:', err);
    }
}

initRabbitMQ().then(() => console.log("RabbitMQ is ready")).catch(console.error);

async function sendOrderToQueue(order, bestPrice) {
    if (!channel) {
        console.error('RabbitMQ channel is not initialized yet.');
        return;
    }
    
    if (order.is_buy && order.order_type === 'MARKET') {
        const allStocks = await axios.get('http://matching_engine:3004/engine/getAvailableStocks', {
            params: {
                stock_id: order.stock_id
            }
        });
        var totalQuantityNotOwn = 0;
        allStocks.data.data.forEach((stockOrder) => {
            if (stockOrder.user_id !== order.user_id) {
                totalQuantityNotOwn += stockOrder.quantity;
            }
        });
        if (totalQuantityNotOwn < order.quantity) {
            return;
        }
        // deduct balance from user
        const user = await User.findById(order.user_id);
        user.balance -= (order.quantity * bestPrice);
        await user.save();
        
        channel.sendToQueue('buy_orders', Buffer.from(JSON.stringify(order)), { persistent: true });
    } else {
        // deduct stock from user
        const userStock = await User_Stocks.findOne({ user_id: order.user_id, stock_id: order.stock_id });
        userStock.quantity_owned -= order.quantity;
        if (userStock.quantity_owned === 0) {
            await User_Stocks.deleteOne({ _id: userStock._id });
        } else {
            await userStock.save();
        }

        // add stock tx for the sell order
        const stockTx = new Stock_Tx({
            stock_id: order.stock_id,
            user_id: order.user_id,
            order_status: 'IN_PROGRESS',
            is_buy: false,
            order_type: order.order_type,
            quantity: order.quantity,
            stock_price: order.price
        });

        await stockTx.save();
        order.stock_tx_id = stockTx._id.toString();
        channel.sendToQueue('sell_orders', Buffer.from(JSON.stringify(order)), { persistent: true });
    }
    console.log(`Order sent: ${JSON.stringify(order)}`);
}

async function sendCancelOrderToQueue(order) {
    try {
        channel.sendToQueue(
            'cancel_orders',
            Buffer.from(JSON.stringify(order)),
            { persistent: true }
        );
        console.log(`Cancel order sent: ${JSON.stringify(order)}`);
    } catch (err) {
        console.error("Failed to send cancel order to queue:", err);
    }
}

// TODO: Figure out how we can get the lowest sell price for any stock from the matching engine
router.get('/transaction/getStockPrices', async (req, res) => { 
    try {
        // Fetch prices from the matching engine
        const stockPrices = await axios.get('http://matching_engine:3004/engine/getPrice'); 
        // Merge the stock prices with the stock data
        const stockDataPromises = stockPrices.data.data.map(async (element) => {
            const stockDataWithPrices = await Stock.findById(element.stock_id);
            console.log("this is the stock data with prices" + stockDataWithPrices.stock_name);
            return {
                "stock_id": element.stock_id,
                "stock_name": stockDataWithPrices.stock_name,
                "current_price": element.best_price
            };
        });

        const stockData = await Promise.all(stockDataPromises);

        return res.status(200).json({
            "success": true,
            "data": stockData
        });
    } catch (error) {
        return res.status(500).json({
            "success": false,
            "data": {
                "error": "There seems to be an error" + error
            }
        });
    }
});

router.post('/engine/placeStockOrder', async (req, res) => {
    const { stock_id, is_buy, order_type, quantity, price } = req.body;
    const user_id = extractCredentials(req).userId;

    if (
        !stock_id ||
        !order_type ||
        !quantity ||
        (is_buy === undefined || is_buy === null) ||
        (order_type === 'LIMIT' && price == null)
    ) {
        return res.status(400).json({
            "success": false,
            "data": {
                "error": "Please provide all the required fields"
            }
        });
    }

    try {
        const stock = await Stock.findById(stock_id);
        if (!stock) {
            return res.status(404).json({ success: false, message: 'Invalid stock ID' });
        }

        const user = await User.findById(user_id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Invalid user ID' });
        }

        if (!is_buy && order_type === 'LIMIT') {
            const userStock = await User_Stocks.findOne({ user_id: user_id, stock_id: stock_id });
            if (!userStock || userStock.quantity_owned < quantity) {
                return res.status(400).json({ success: false, message: 'Insufficient stocks' });
            }
        }

        console.log("We have reached here successfully haha");
        var bestPrice = null;
        if (is_buy && order_type === 'MARKET') {
            bestPrice = await axios.get('http://matching_engine:3004/engine/getPrice', {
                params: {
                    stock_id: stock_id
                }
            });
            console.log("received best price response" + bestPrice.data);
            bestPrice = bestPrice.data.data.best_price;
            console.log("this is the best price" + bestPrice);
            if (user.balance < bestPrice * quantity) {
                return res.status(400).json({ "success": false, "data": { "error" : 'Insufficient funds' }});
            } else if (price) {
                return res.status(400).json({ "success": false, "data": { "error" : 'Price should not be provided for market orders' }});
            }
        }

        const orderData = {
            stock_id: stock_id,
            user_id: user_id,
            is_buy: is_buy,
            order_type: order_type,
            quantity: quantity,
            price: price
        };
        await sendOrderToQueue(orderData, bestPrice);
        
        return res.json({ success: true, data: null });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/engine/cancelStockTransaction', async (req, res) => {
    const { stock_tx_id } = req.body;
    const user_id = extractCredentials(req).userId;

    // Validate stock_tx_id format
    if (!mongoose.Types.ObjectId.isValid(stock_tx_id)) {
        return res.status(400).json({ success: false, message: "Invalid transaction ID" });
    }

    try {
        const transaction = await Stock_Tx.findById(stock_tx_id);
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        if (transaction.user_id.toString() !== user_id){
            return res.status(401).json({ success: false, message: 'Unauthorized action' });
        }
        
        console.log("Sending cancel request for transaction:", stock_tx_id);
        sendCancelOrderToQueue({ stock_tx_id: stock_tx_id });

        return res.json({ "success": true, "data": null });
    } catch (err) {
        return res.status(500).json({ "success": false, "data": {"error": err.message} });
    }
});

module.exports = router;