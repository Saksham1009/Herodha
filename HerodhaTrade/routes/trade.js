const express = require('express');
const router = express.Router();
const Stock = require('./../model/Stock');
const Stock_Tx = require('./../model/Stock_Tx');
const User = require('./../model/User');
const jwt = require('jsonwebtoken');
const amqp = require('amqplib');

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
        await channel.assertQueue('order_queue', { durable: true });
        console.log('RabbitMQ connection and channel initialized');
    } catch (err) {
        console.error('Error initializing RabbitMQ:', err);
    }
}

async function sendOrderToQueue(order) {
    if (order.is_buy && order.order_type === 'MARKET') {
        channel.sendToQueue('buy_orders', Buffer.from(JSON.stringify(order)), { persistent: true });
    } else {
        channel.sendToQueue('sell_orders', Buffer.from(JSON.stringify(order)), { persistent: true });
    }
    console.log(`Order sent: ${JSON.stringify(order)}`);
}

async function sendCancelOrderToQueue(order) {
    channel.sendToQueue('cancel_orders', Buffer.from(JSON.stringify(order)), { persistent: true });
    console.log(`Cancel order sent: ${JSON.stringify(order)}`);
}

initRabbitMQ();

// TODO: Figure out how we can get the lowest sell price for any stock from the matching engine
router.get('/getStockPrices', async (req, res) => { 
    try {
        const stock = await Stock.find();
        return res.status(200).json({
            "success": true,
            "data": stock
        });
    } catch (error) {
        returnres.status(500).json({
            "success": false,
            "data": {
                "error": "There seems to be an error" + error
            }
        });
    }
});

router.post('/placeStockOrder', async (req, res) => {
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

        // TODO: Add a function here to get the current price of the stock from the matching engine
        if (is_buy && order_type === 'MARKET') {
            if (user.balance < stock.currentPrice * quantity) {
                return res.status(400).json({ "success": false, "data": { "error" : 'Insufficient funds' }});
            } else if (price) {
                return res.status(400).json({ "success": false, "data": { "error" : 'Price should not be provided for market orders' }});
            }
            return res.status(400).json({ success: false, message: 'Insufficient funds' });
        }

        const orderData = {
            stock_id: stock_id,
            user_id: user_id,
            is_buy: is_buy,
            order_type: order_type,
            quantity: quantity,
            price: price
        };
        await sendOrderToQueue(orderData);
        
        return res.json({ success: true, data: null });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/cancelStockTransaction', async (req, res) => {
    const { stock_tx_id } = req.body;
    const user_id = extractCredentials(req).userId;

    try {
        const transaction = await Stock_Tx.findById(stock_tx_id);
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        if (transaction.user_id.toSring() !== user_id){
            return res.status(401).json({ success: false, message: 'Unauthorized action' });
        }

        sendCancelOrderToQueue({ stock_tx_id: stock_tx_id });

        return res.json({ "success": true, "data": null });
    } catch (err) {
        return res.status(500).json({ "success": false, "data": {"error": err.message} });
    }
});

module.exports = router;