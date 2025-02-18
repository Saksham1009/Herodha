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
        // deduct balance from user
        const user = await User.findById(order.user_id);
        user.balance -= (order.quantity * bestPrice);

        await user.save();
        
        channel.sendToQueue('buy_orders', Buffer.from(JSON.stringify(order)), { persistent: true });
    } else {
        // deduct stock from user
        const userStock = await User_Stocks.findOne({ user_id: order.user_id, stock_id: order.stock_id });
        userStock.quantity_owned -= order.quantity;
        await userStock.save();

        // add stock tx for the sell order
        const stockTx = new Stock_Tx({
            stock_id: order.stock_id,
            user_id: order.user_id,
            order_status: 'IN_PROGRESS',
            is_buy: false,
            order_type: order.order_type,
            quantity: order.quantity,
            price: order.price
        });

        await stockTx.save();
        channel.sendToQueue('sell_orders', Buffer.from(JSON.stringify(order)), { persistent: true });
    }
    console.log(`Order sent: ${JSON.stringify(order)}`);
}

async function sendCancelOrderToQueue(order) {
    channel.sendToQueue('cancel_orders', Buffer.from(JSON.stringify(order)), { persistent: true });
    console.log(`Cancel order sent: ${JSON.stringify(order)}`);
}

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

        if (!is_buy && order_type === 'LIMIT') {
            const userStock = await User_Stocks.findOne({ user_id: user_id, stock_id: stock_id });
            if (!userStock || userStock.quantity_owned < quantity) {
                return res.status(400).json({ success: false, message: 'Insufficient stocks' });
            }
        }

        const bestPrice = 0;
        if (is_buy && order_type === 'MARKET') {
            const bestPrice = 100; // TODO: Get the best price from the matching engine
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