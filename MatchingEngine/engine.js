require('dotenv').config();
const amqp = require('amqplib');
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq';
const connectToDB = require('./config/dbConnect');
const Stock_Tx = require('./model/Stock_Tx');
const Stock = require('./model/Stock');
const Wallet_Tx = require('./model/Wallet_Tx');
const User_Stocks = require('./model/User_Stocks');
const User = require('./model/User');


const express = require('express');
const app = express();
app.use(express.json());

app.get('/engine/getAvailableStocks', async (req, res) => {
    let { stock_id } = req.query;


    console.log("Stock ID" + req.query);

    try {
        let stocks = [];
        const stockList = orderBook.stockOrderBooks.get(stock_id);
        stocks = stockList.getAllOrders();
        if (!stockList || stockList.isEmpty()) {
            return;
        }

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
        orderBook.addBuyOrder(order);
    } catch (error) {
        console.error('Error processing buy order:', error);
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

        orderBook.addSellOrder(order);
    } catch (error) {
        console.error('Error processing sell order:', error);
    }
});

app.post('/engine/cancelOrder', async (req, res) => {
    const orderData = req.body.order;
    try {
        console.log('Processing cancel order:', orderData);

        orderBook.cancelOrder(orderData);
    } catch (error) {
        console.error('Error processing cancel order:', error);
    }
});

app.get('/engine/getPrice', (req, res) => {
    console.log("Received request with query params:", req.query);
    let { stock_id } = req.query;

    try {
        if (!stock_id) {
            console.log("Yaha aa gaye");
            const bestPrices = [];
            console.log("This is the orderBook" + orderBook.stockOrderBooks);
            orderBook.stockOrderBooks.forEach(item => {
                const price = item.peek();
                const order = item.getOrdersAtPrice(price)[0];
                console.log("This is the order" + order.stock_id);
                console.log("This is the price" + price);
                bestPrices.push({
                    "stock_id": order.stock_id,
                    "best_price": price
                });
            });
            console.log("This is the best prices" + bestPrices);
            return res.status(200).json({
                success: true,
                data: bestPrices
            });
        } else {
            console.log("vaha a a gaaya");
            const stockBook = orderBook.stockOrderBooks.get(stock_id);
            console.log("This is the best price" + stockBook);
            if (!stockBook || stockBook.isEmpty()) {
                console.log("kya hum yaha aa gaue");
                return res.status(404).json({
                    success: false,
                    message: 'No sell orders found for this stock'
                });
            } else {
                console.log("Inside aa gaye");
                const price = stockBook.peek();
                console.log("This is the price" + price);
                const order = stockBook.getOrdersAtPrice(price)[0];
                console.log("This is the order" + order.stock_id);
                return res.status(200).json({
                    success: true,
                    data: {
                        stock_id: order.stock_id,
                        best_price: price
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error fetching best price:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

connectToDB();

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


app.listen(3004);

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
        const bestOrder = this.heap[0];
        if (bestOrder.user_id !== user_id) {
            return bestOrder.price;
        } else {
            let i = 1;
            while (bestOrder.user_id === user_id) {
                bestOrder = this.heap[i];
                i++;
            }
            return bestOrder.price
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
            console.log("Stock ID DOES NOT Exists!");
            this.stockOrderBooks.set(stock_id, new PriorityQueue((a, b) => a < b));
        }
        console.log("Stock ID Exists!");
        return this.stockOrderBooks.get(stock_id);
    }

    getStockOrderBookIfExists(stock_id) {
        if (!this.stockOrderBooks.has(stock_id)) {
            return null;
        } else {
            return this.stockOrderBooks.get(stock_id);
        }
    }

    async addBuyOrder(order) {
        this.validateOrder(order);

        // Ensure buy orders are only MARKET orders
        if (order.order_type !== 'MARKET') {
            throw new Error('Buy orders must be of type MARKET');
        }

        const orderBook = this.getStockOrderBook(order.stock_id);
        
        while (order.remaining_quantity > 0) {
            const bestPrice = orderBook.peek(order.user_id);
            if (!bestPrice) throw new Error('No sell orders available');

            const sellOrders = orderBook.getOrdersAtPrice(bestPrice);
            if (!sellOrders.length) throw new Error('No sell orders available 2');

            // Get the first valid sell order (different user)
            const sellOrder = sellOrders.find(so => so.user_id !== order.user_id);
            if (!sellOrder) throw new Error('No sell orders available 3');

            // For market orders, any price is acceptable
            const matchQuantity = Math.min(order.remaining_quantity, sellOrder.remaining_quantity);

            // Execute the trade
            await this.executeTrade(order, sellOrder, matchQuantity);

            // Update quantities
            order.remaining_quantity -= matchQuantity;
            sellOrder.remaining_quantity -= matchQuantity; //change to qunatity - matched

            // Update order status
            order.order_status = order.remaining_quantity === 0 ? 'COMPLETED' : 'PARTIALLY_COMPELTE';

            console.log("Yaha pohonch gaue");

            if (sellOrder.remaining_quantity === 0) {
                const parentStockTx = await Stock_Tx.findById(sellOrder.stock_tx_id);
                parentStockTx.order_status = 'COMPLETED';
                await parentStockTx.save();
            }

            // Remove completed sell order
            if (sellOrder.remaining_quantity === 0) {
                const orders = orderBook.getOrdersAtPrice(bestPrice);
                const index = orders.indexOf(sellOrder);
                if (index !== -1) {
                    orders.splice(index, 1);
                }
                if (orders.length === 0) {
                    orderBook.dequeue();
                }
            }

            console.log("Here");
        }

        return;
    }

    addSellOrder(order) {
        this.validateOrder(order);

        const orderBook = this.getStockOrderBook(order.stock_id);
        orderBook.enqueue(order.price, order);
        // this.orderIndex.set(order.stock_id + '_' + order.user_id, order);

        return true;
    }

    async cancelOrder(orderData) {
        // const orderId = orderData.stock_id + '_' + orderData.user_id;
        // const order = this.orderIndex.get(orderId);
        console.log("first breakpoint");
        // console.log("this is the order" + order);

        // Remove from order book
        const orderBook = this.getStockOrderBookIfExists(orderData.stock_id);
        if (!orderBook) {
            return;
        }
        console.log("Order book: " + orderBook);
        const orders = orderBook.getAllOrders();
        console.log("second breakpoint");
        console.log("Orders: " + orders);
        var order = orders.filter((currentOrder) => {
            console.log("Current Order: " + currentOrder.user_id);
            console.log("Order Data: " + orderData.user_id);
            return currentOrder.user_id === orderData.user_id;
        })[0];
        if (!order) {
            return;
        }
        console.log("First ORder in can: " + order);
        if (order.is_buy !== false || order.order_type !== 'LIMIT' || order.order_status === 'COMPLETED') {
            console.log("third breakpoint, inside the if");
            return;
        }
        const remaining_quantity = order.remaining_quantity;
        console.log("Remaining quantity: " + remaining_quantity);
        if (orders) {
            const index = orders.findIndex(o => o.user_id === orderData.user_id && o.stock_tx_id === orderData.stock_tx_id);
            if (index !== -1) {
                orders.splice(index, 1);
            }
        }

        console.log("fifth breakpoint");

        // update the stock transaction in Stock_Tx DB
        const stockTx = await Stock_Tx.findById(orderData.stock_tx_id);

        console.log("sixth breakpoint");
        
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

        console.log("seventh breakpoint");

        return true;
    }

    validateOrder(order) {
        if (!order.stock_id || !order.user_id || !order.initial_quantity || order.initial_quantity <= 0) {
            throw new Error('Invalid order parameters passed');
        }

        // Ensure buy orders are only MARKET orders
        if (order.is_buy && order.order_type !== 'MARKET') {
            throw new Error('Buy orders must be of type MARKET');
        }

        // Ensure sell orders are only LIMIT orders
        if (!order.is_buy && order.order_type !== 'LIMIT') {
            throw new Error('Sell orders must be of type LIMIT');
        }

        if (order.order_type === 'LIMIT' && (!order.price || order.price <= 0)) {
            throw new Error('Invalid LIMIT order parameters passed');
        }
    }

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
            console.log("Stock transaction push kr rhe h ");
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
            await stockTx.save();

            const parentStockTx = await Stock_Tx.findById(sellOrder.stock_tx_id);
            parentStockTx.order_status = 'PARTIALLY_COMPLETE';
            await parentStockTx.save();

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
            await buyOrderStockTx.save();


            var buyUserStock = await User_Stocks.findOne({ user_id: buyOrder.user_id, stock_id: buyOrder.stock_id });
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
            await buyUserStock.save();

            const walletTx = new Wallet_Tx({
                stock_id: sellOrder.stock_id,
                user_id: sellOrder.user_id,
                amount: quantity * sellOrder.price,
                is_debit: false,
                stock_tx_id: stockTx._id.toString()
            });
            await walletTx.save();

            const buyOrderWalletTx = new Wallet_Tx({
                stock_id: buyOrder.stock_id,
                user_id: buyOrder.user_id,
                amount: quantity * sellOrder.price,
                is_debit: true,
                stock_tx_id: buyOrderStockTx._id.toString()
            });
            await buyOrderWalletTx.save();

            buyOrderStockTx.wallet_tx_id = buyOrderWalletTx._id.toString();
            await buyOrderStockTx.save();

            stockTx.wallet_tx_id = walletTx._id.toString();
            await stockTx.save();

            const user = await User.findById(sellOrder.user_id);
            user.balance += (quantity * sellOrder.price);
            await user.save();
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
    // await channel.assertQueue('stock_transactions', { durable: true });

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
                console.log('Processing buy order:', order);

                channel.ack(message);
                orderBook.addBuyOrder(order);
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
                console.log('Processing sell order:', order);

                orderBook.addSellOrder(order);
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
                console.log('Processing cancel order:', orderData);

                orderBook.cancelOrder(orderData);
                channel.ack(message);
            } catch (error) {
                console.error('Error processing cancel order:', error);
                channel.nack(message);
            }
        }
    });
}

startConsumer();