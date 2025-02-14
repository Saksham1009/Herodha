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

//GET /getStockPrices 
// but need this from matching engine queue
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

//POST /placeStockOrder (Market or Limit)
router.post('/placeStockOrder', async (req, res) => {
    const { stock_id, is_buy, order_type, quantity, price } = req.body;
    const user_id = extractCredentials(req).userId; // From token

    if (!stock_id || !order_type || !quantity || (order_type === 'LIMIT' && price == null)) {
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

        if (is_buy && user.balance < (order_type === 'MARKET' ? stock.current_price * quantity : price * quantity)) {
            return res.status(400).json({ success: false, message: 'Insufficient funds' });
        }

        // if (!is_buy && user.stocks[stock_id] < quantity) {
        //     return res.status(400).json({ success: false, message: 'Insufficient stock quantity' });
        // } 
        // need to do this in matching engine

        if (order_type === 'MARKET' ) { //ask, jane de ke nahi?
            price = null; // Ignore the price field for market orders
        }

        const newTransaction = new Stock_Tx({
            stock_id,
            user_id,
            is_buy,
            order_type,
            quantity,
            price: order_type === 'LIMIT' ? price : null,
            order_status: 'IN_PROGRESS',
            time_stamp: new Date()
        });
        //push this to queue (matching engine)
        //object with info about stock transaction

        // await newTransaction.save();

        // Send the order to RabbitMQ
        await sendOrderToQueue(newTransaction);
        
        return res.json({ success: true, data: null });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

async function sendOrderToQueue(order) {
    const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq';
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue('order_queue', { durable: true });

    channel.sendToQueue('order_queue', Buffer.from(JSON.stringify(order)), { persistent: true });

    console.log(`Order sent: ${JSON.stringify(order)}`);
    setTimeout(() => connection.close(), 500);
}

//POST /cancelStockTransaction
router.post('/cancelStockTransaction', async (req, res) => {
    const { stock_tx_id } = req.body;
    const user_id = extractCredentials(req).userId; // From token

    try {
        const transaction = await Stock_Tx.findById(stock_tx_id);
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        if(transaction.user_id.toSring() !== user_id){
            return res.status(401).json({ success: false, message: 'Unauthorized action' });
        }

        if (transaction.order_status !== 'IN_PROGRESS' && transaction.order_status !== 'PARTIALLY_COMPLETE') {
            return res.status(400).json({ success: false, message: 'Transaction cannot be canceled' });
        }

        transaction.order_status = 'CANCELLED';
        await transaction.save();
        // refundWalletOrStock(transaction); // Refund wallet or stock

        return res.json({ success: true, data: null });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;