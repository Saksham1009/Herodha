require('dotenv').config();
const amqp = require('amqplib');
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq';
const connectToDB = require('./config/dbConnect');
const Stock_Tx = require('./model/Stock_Tx');
const Stock = require('./model/Stock');
const Wallet_Tx = require('./model/Wallet_Tx');
const User_Stocks = require('./model/User_Stocks');
const User = require('./model/User');
const redis = require('redis');

const express = require('express');
const app = express();
app.use(express.json());

redis.createClient({ host: 'localhost', port: 6379 });

app.get('/engine/getAvailableStocks', async (req, res) => {
    let { stock_id } = req.query;
    console.log("Stock ID", req.query);
    try {
        const stockList = orderBook.stockOrderBooks.get(stock_id);
        if (!stockList || stockList.isEmpty()) {
            return res.status(404).json({
                success: false,
                message: 'No orders found for this stock'
            });
        }
        const stocks = stockList.getAllOrders();
        return res.status(200).json({
            success: true,
            data: stocks
        });
    } catch (error) {
        console.error('Error fetching available stocks:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.post('/engine/addBuyOrder', async (req, res) => {
    const orderData = req.body.order;
    try {
        const order = new Order(
            orderData.stock_id,
            orderData.user_id,
            orderData.is_buy,
            orderData.order_type,
            orderData.quantity,
            orderData.price
        );
        console.log('Processing buy order:', order);
        await orderBook.addBuyOrder(order);
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error processing buy order:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/engine/addSellOrder', async (req, res) => {
    const orderData = req.body.order;
    try {
        const order = new Order(
            orderData.stock_id,
            orderData.user_id,
            orderData.is_buy,
            orderData.order_type,
            orderData.quantity,
            orderData.price,
            orderData.stock_tx_id
        );
        console.log('Processing sell order:', order);
        await orderBook.addSellOrder(order);
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error processing sell order:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/engine/cancelOrder', async (req, res) => {
    const orderData = req.body.order;
    try {
        console.log('Processing cancel order:', orderData);
        await orderBook.cancelOrder(orderData);
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error processing cancel order:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/engine/getPrice', (req, res) => {
    console.log("Received request with query params:", req.query);
    let { stock_id } = req.query;
    try {
        if (!stock_id) {
            const bestPrices = [];
            orderBook.stockOrderBooks.forEach(item => {
                const price = item.peek();
                const order = item.getOrdersAtPrice(price)[0];
                bestPrices.push({
                    stock_id: order.stock_id,
                    best_price: price
                });
            });
            return res.status(200).json({
                success: true,
                data: bestPrices
            });
        } else {
            const stockBook = orderBook.stockOrderBooks.get(stock_id);
            if (!stockBook || stockBook.isEmpty()) {
                return res.status(404).json({
                    success: false,
                    message: 'No sell orders found for this stock'
                });
            }
            const price = stockBook.peek();
            const order = stockBook.getOrdersAtPrice(price)[0];
            return res.status(200).json({
                success: true,
                data: {
                    stock_id: order.stock_id,
                    best_price: price
                }
            });
        }
    } catch (error) {
        console.error('Error fetching best price:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.post('/', (req, res) => {
    const stock_id = req.body.stock_id;
    const user_id = req.body.user_id;
    const bestPrice = orderBook.getBestPrice(stock_id, user_id);
    return res.status(200).json({
        success: true,
        data: {
            stock_id: stock_id,
            best_price: bestPrice
        }
    });
});

connectToDB();
app.listen(3004, () => {
    console.log('Matching Engine listening on port 3004');
});


class PriorityQueue {
    constructor(comparator) {
        this.heap = [];
        this.comparator = comparator;
        this.orderMap = new Map();
    }
    peek() {
        return this.heap[0];
    }
    peekBestPrice(user_id) {
        let bestOrder = this.heap[0];
        if (bestOrder.user_id !== user_id) {
            return bestOrder.price;
        } else {
            let i = 1;
            while (this.heap[i] && this.heap[i].user_id === user_id) {
                bestOrder = this.heap[i];
                i++;
            }
            return bestOrder.price;
        }
    }
    enqueue(price, order) {
        if (!this.orderMap.has(price)) {
            this.orderMap.set(price, []);
            this.heap.push(price);
            this._bubbleUp(this.heap.length - 1);
        }
        this.orderMap.get(price).push(order);
    }
    dequeue() {
        if (this.isEmpty()) return null;
        const bestPrice = this.heap[0];
        const orders = this.orderMap.get(bestPrice);
        const order = orders.shift();
        if (orders.length === 0) {
            this.orderMap.delete(bestPrice);
            const lastPrice = this.heap.pop();
            if (this.heap.length > 0) {
                this.heap[0] = lastPrice;
                this._bubbleDown(0);
            }
        }
        return order;
    }
    isEmpty() {
        return this.heap.length === 0;
    }
    _bubbleUp(index) {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.comparator(this.heap[parentIndex], this.heap[index])) break;
            [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
            index = parentIndex;
        }
    }
    _bubbleDown(index) {
        while (true) {
            let smallest = index;
            const leftChild = 2 * index + 1;
            const rightChild = 2 * index + 2;
            if (leftChild < this.heap.length && this.comparator(this.heap[leftChild], this.heap[smallest])) {
                smallest = leftChild;
            }
            if (rightChild < this.heap.length && this.comparator(this.heap[rightChild], this.heap[smallest])) {
                smallest = rightChild;
            }
            if (smallest === index) break;
            [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
            index = smallest;
        }
    }
    getAllOrders() {
        const orders = [];
        this.heap.forEach(price => {
            orders.push(...this.orderMap.get(price));
        });
        return orders;
    }
    getOrdersAtPrice(price) {
        return this.orderMap.get(price) || [];
    }
}

class Order {
    constructor(stock_id, user_id, is_buy, order_type, quantity, price, stock_tx_id = null) {
        this.stock_id = stock_id;
        this.stock_tx_id = stock_tx_id;
        this.user_id = user_id;
        this.is_buy = is_buy;
        this.order_type = order_type;
        this.initial_quantity = quantity;
        this.remaining_quantity = quantity;
        this.price = price;
        this.order_status = "IN_PROGRESS";
        this.timestamp = Date.now();
    }
}

class OrderBook {
    constructor() {
        this.stockOrderBooks = new Map();
        this.orderIndex = new Map();
        this.trades = [];
        this.expiryMinutes = 15; // Orders expire after 15 minutes
    }
    getBestPrice(stock_id, user_id) {
        const orderBook = this.getStockOrderBook(stock_id);
        const bestPrice = orderBook.peekBestPrice(user_id);
        return bestPrice || null;
    }
    getStockOrderBook(stock_id) {
        if (!this.stockOrderBooks.has(stock_id)) {
            console.log("Stock ID DOES NOT Exists! Creating new order book for", stock_id);
            this.stockOrderBooks.set(stock_id, new PriorityQueue((a, b) => a < b));
        }
        return this.stockOrderBooks.get(stock_id);
    }
    getStockOrderBookIfExists(stock_id) {
        return this.stockOrderBooks.get(stock_id) || null;
    }

    async addBuyOrder(order) {
        this.validateOrder(order);
        if (order.order_type !== 'MARKET') {
            throw new Error('Buy orders must be of type MARKET');
        }
        const orderBook = this.getStockOrderBook(order.stock_id);
        while (order.remaining_quantity > 0) {
            const bestPrice = orderBook.peek();
            if (!bestPrice) throw new Error('No sell orders available');
            const sellOrders = orderBook.getOrdersAtPrice(bestPrice);
            if (!sellOrders.length) throw new Error('No sell orders available 2');
            const sellOrder = sellOrders.find(so => so.user_id !== order.user_id);
            if (!sellOrder) throw new Error('No sell orders available 3');
            const matchQuantity = Math.min(order.remaining_quantity, sellOrder.remaining_quantity);
            await this.executeTrade(order, sellOrder, matchQuantity);
            order.remaining_quantity -= matchQuantity;
            sellOrder.remaining_quantity -= matchQuantity;
            order.order_status = order.remaining_quantity === 0 ? 'COMPLETED' : 'PARTIALLY_COMPELTE';
            console.log("Trade executed for", matchQuantity, "units");
            if (sellOrder.remaining_quantity === 0) {
                const parentStockTx = await Stock_Tx.findById(sellOrder.stock_tx_id);
                parentStockTx.order_status = 'COMPLETED';
                await parentStockTx.save();
            }
            if (sellOrder.remaining_quantity === 0) {
                const orders = orderBook.getOrdersAtPrice(bestPrice);
                const index = orders.indexOf(sellOrder);
                if (index !== -1) orders.splice(index, 1);
                if (orders.length === 0) orderBook.dequeue();
            }
        }
        return;
    }

    addSellOrder(order) {
        this.validateOrder(order);
        const orderBook = this.getStockOrderBook(order.stock_id);
        orderBook.enqueue(order.price, order);
        return true;
    }

    async cancelOrder(orderData) {
        console.log("Processing cancel order for", orderData);
        const orderBook = this.getStockOrderBookIfExists(orderData.stock_id);
        if (!orderBook) return;
        const orders = orderBook.getAllOrders();
        const order = orders.filter(cur => cur.user_id === orderData.user_id)[0];
        if (!order) return;
        if (order.is_buy !== false || order.order_type !== 'LIMIT' || order.order_status === 'COMPLETED') return;
        const remaining_quantity = order.remaining_quantity;
        const index = orders.findIndex(o => o.user_id === orderData.user_id && o.stock_tx_id === orderData.stock_tx_id);
        if (index !== -1) orders.splice(index, 1);
        const stockTx = await Stock_Tx.findById(orderData.stock_tx_id);
        stockTx.order_status = 'CANCELLED';
        await stockTx.save();
        const userStock = await User_Stocks.findOne({ user_id: orderData.user_id, stock_id: orderData.stock_id });
        if (!userStock) {
            const newUserStock = new User_Stocks({
                user_id: orderData.user_id,
                stock_name: orderData.stock_name,
                stock_id: orderData.stock_id,
                quantity_owned: remaining_quantity
            });
            await newUserStock.save();
        } else {
            userStock.quantity_owned += remaining_quantity;
            await userStock.save();
        }
        return true;
    }

    validateOrder(order) {
        if (!order.stock_id || !order.user_id || !order.initial_quantity || order.initial_quantity <= 0) {
            throw new Error('Invalid order parameters passed');
        }
        if (order.is_buy && order.order_type !== 'MARKET') {
            throw new Error('Buy orders must be of type MARKET');
        }
        if (!order.is_buy && order.order_type !== 'LIMIT') {
            throw new Error('Sell orders must be of type LIMIT');
        }
        if (order.order_type === 'LIMIT' && (!order.price || order.price <= 0)) {
            throw new Error('Invalid LIMIT order parameters passed');
        }
    }

    // Updated executeTrade using Promise.all to parallelize independent DB operations
    async executeTrade(buyOrder, sellOrder, quantity) {
        const trade = {
            buy_order_user_id: buyOrder.user_id,
            sell_order_user_id: sellOrder.user_id,
            stock_id: buyOrder.stock_id,
            price: sellOrder.price,
            quantity: quantity,
            timestamp: Date.now()
        };
        this.trades.push(trade);

        try {
            // Create a stock transaction document for the sell side.
            const stockTx = new Stock_Tx({
                stock_id: sellOrder.stock_id,
                user_id: sellOrder.user_id,
                quantity: quantity,
                stock_price: sellOrder.price,
                is_buy: false,
                order_status: 'COMPLETED',
                parent_stock_tx_id: sellOrder.stock_tx_id,
                order_type: sellOrder.order_type,
                wallet_tx_id: null
            });
            // Start saving stockTx and concurrently fetch parent transaction.
            const [savedStockTx, parentStockTx] = await Promise.all([
                stockTx.save(),
                Stock_Tx.findById(sellOrder.stock_tx_id)
            ]);
            parentStockTx.order_status = 'PARTIALLY_COMPLETE';
            const saveParentPromise = parentStockTx.save();

            // Create buy order stock transaction.
            const buyOrderStockTx = new Stock_Tx({
                stock_id: buyOrder.stock_id,
                user_id: buyOrder.user_id,
                quantity: quantity,
                stock_price: sellOrder.price,
                is_buy: true,
                order_status: 'COMPLETED',
                parent_stock_tx_id: null,
                order_type: buyOrder.order_type,
                wallet_tx_id: null
            });
            const saveBuyOrderStockTx = buyOrderStockTx.save();

            // Update or create the user stock document.
            const updateUserStockPromise = (async () => {
                let buyUserStock = await User_Stocks.findOne({ user_id: buyOrder.user_id, stock_id: buyOrder.stock_id });
                if (buyUserStock) {
                    buyUserStock.quantity_owned += quantity;
                } else {
                    const stock = await Stock.findById(buyOrder.stock_id);
                    buyUserStock = new User_Stocks({
                        user_id: buyOrder.user_id,
                        stock_name: stock.stock_name,
                        stock_id: buyOrder.stock_id,
                        quantity_owned: quantity
                    });
                }
                return buyUserStock.save();
            })();

            // Create wallet transactions.
            const walletTx = new Wallet_Tx({
                stock_id: sellOrder.stock_id,
                user_id: sellOrder.user_id,
                amount: quantity * sellOrder.price,
                is_debit: false,
                stock_tx_id: savedStockTx._id.toString()
            });
            const buyOrderWalletTx = new Wallet_Tx({
                stock_id: buyOrder.stock_id,
                user_id: buyOrder.user_id,
                amount: quantity * sellOrder.price,
                is_debit: true,
                stock_tx_id: buyOrderStockTx._id.toString()
            });
            const saveWalletPromises = Promise.all([walletTx.save(), buyOrderWalletTx.save()]);

            // Execute all independent operations concurrently.
            await Promise.all([
                saveParentPromise,
                saveBuyOrderStockTx,
                updateUserStockPromise,
                saveWalletPromises
            ]);

            // Update wallet transaction references.
            buyOrderStockTx.wallet_tx_id = buyOrderWalletTx._id.toString();
            stockTx.wallet_tx_id = walletTx._id.toString();
            await Promise.all([
                buyOrderStockTx.save(),
                stockTx.save()
            ]);

            // Update the seller's user balance.
            await (async () => {
                const user = await User.findById(sellOrder.user_id);
                user.balance += (quantity * sellOrder.price);
                return user.save();
            })();
        } catch (error) {
            console.error('Error executing trade:', error);
        }
        return trade;
    }
}

const orderBook = new OrderBook();

async function startConsumer() {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue('buy_orders', { durable: true });
    await channel.assertQueue('sell_orders', { durable: true });
    await channel.assertQueue('cancel_orders', { durable: true });

    console.log('Waiting for orders...');

    channel.consume('buy_orders', async (message) => {
        if (message) {
            try {
                const orderData = JSON.parse(message.content.toString());
                const order = new Order(
                    orderData.stock_id,
                    orderData.user_id,
                    orderData.is_buy,
                    orderData.order_type,
                    orderData.quantity,
                    orderData.price
                );
                console.log('Processing buy order from queue:', order);
                await orderBook.addBuyOrder(order);
                channel.ack(message);
                
            } catch (error) {
                console.error('Error processing buy order:', error);
                channel.nack(message);
            }
        }
    });

    channel.consume('sell_orders', async (message) => {
        if (message) {
            try {
                const orderData = JSON.parse(message.content.toString());
                const order = new Order(
                    orderData.stock_id,
                    orderData.user_id,
                    orderData.is_buy,
                    orderData.order_type,
                    orderData.quantity,
                    orderData.price,
                    orderData.stock_tx_id
                );
                console.log('Processing sell order from queue:', order);
                await orderBook.addSellOrder(order);
                channel.ack(message);
            } catch (error) {
                console.error('Error processing sell order:', error);
                channel.nack(message);
            }
        }
    });

    channel.consume('cancel_orders', async (message) => {
        if (message) {
            try {
                const orderData = JSON.parse(message.content.toString());
                console.log('Processing cancel order from queue:', orderData);
                await orderBook.cancelOrder(orderData);
                channel.ack(message);
            } catch (error) {
                console.error('Error processing cancel order:', error);
                channel.nack(message);
            }
        }
    });
}

startConsumer();
