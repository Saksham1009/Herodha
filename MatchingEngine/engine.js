require('dotenv').config();
const amqp = require('amqplib');
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq';
const connectToDB = require('./config/dbConnect');
const Stock_Tx = require('./model/Stock_Tx');
const Stock = require('./model/Stock');
const Wallet_Tx = require('./model/Wallet_Tx');
const User_Stocks = require('./model/User_Stocks');
const User = require('./model/User');
const Redis = require('ioredis'); // this could be an issue -> revert to redis

// Redis client setup
const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379');

const express = require('express');
const app = express();
app.use(express.json());

app.get('/engine/getAvailableStocks', async (req, res) => {
    let { stock_id } = req.query;

    console.log("Stock ID" + req.query);

    try {
        const orderBook = new OrderBook();
        let stocks = [];
        const stockList = await orderBook.getStockOrderBook(stock_id);
        if (!stockList || await orderBook.isStockOrderBookEmpty(stock_id)) {
            return res.status(404).json({
                success: false,
                message: 'No orders found for this stock'
            });
        }
        
        stocks = await orderBook.getAllOrders(stock_id);
        
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
        const orderBook = new OrderBook();
        await orderBook.addBuyOrder(order);
        
        return res.status(200).json({
            success: true,
            message: 'Buy order processed successfully'
        });
    } catch (error) {
        console.error('Error processing buy order:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
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

        const orderBook = new OrderBook();
        await orderBook.addSellOrder(order);
        
        return res.status(200).json({
            success: true,
            message: 'Sell order processed successfully'
        });
    } catch (error) {
        console.error('Error processing sell order:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.post('/engine/cancelOrder', async (req, res) => {
    const orderData = req.body.order;
    try {
        console.log('Processing cancel order:', orderData);

        const orderBook = new OrderBook();
        await orderBook.cancelOrder(orderData);
        
        return res.status(200).json({
            success: true,
            message: 'Order cancelled successfully'
        });
    } catch (error) {
        console.error('Error processing cancel order:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.get('/engine/getPrice', async (req, res) => {
    console.log("Received request with query params:", req.query);
    let { stock_id } = req.query;
    const orderBook = new OrderBook();

    try {
        if (!stock_id) {
            const bestPrices = await orderBook.getAllBestPrices();
            console.log("Best prices:", bestPrices);
            return res.status(200).json({
                success: true,
                data: bestPrices
            });
        } else {
            const stockBook = await orderBook.getStockOrderBookIfExists(stock_id);
            if (!stockBook || await orderBook.isStockOrderBookEmpty(stock_id)) {
                return res.status(404).json({
                    success: false,
                    message: 'No sell orders found for this stock'
                });
            } else {
                const bestPrice = await orderBook.getBestPrice(stock_id);
                const orders = await orderBook.getOrdersAtPrice(stock_id, bestPrice);
                if (!orders || orders.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'No orders found for this stock at best price'
                    });
                }
                const order = JSON.parse(orders[0]);
                return res.status(200).json({
                    success: true,
                    data: {
                        stock_id: order.stock_id,
                        best_price: bestPrice
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

app.post('/', async (req, res) => {
    const stock_id = req.body.stock_id;
    const user_id = req.body.user_id;

    const orderBook = new OrderBook();
    const bestPrice = await orderBook.getBestPrice(stock_id, user_id);
    return res.status(200).json({
        success: true,
        data: {
            stock_id: stock_id,
            best_price: bestPrice
        }
    });
});

app.listen(3004, () => {
    console.log('Order engine service running on port 3004');
});

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
        this.expiryMinutes = 15; // Orders expire after 15 minutes
    }

    // Redis key helpers
    getStockKey(stock_id) {
        return `stock:${stock_id}`;
    }
    
    getPriceKey(stock_id, price) {
        return `stock:${stock_id}:price:${price}`;
    }
    
    getStockPricesKey(stock_id) {
        return `stock:${stock_id}:prices`;
    }
    
    getTradesKey() {
        return 'trades';
    }
    
    getStocksKey() {
        return 'stocks';
    }

    async getAllStocks() {
        return await redis.smembers(this.getStocksKey());
    }

    async getBestPrice(stock_id, user_id = null) {
        const pricesKey = this.getStockPricesKey(stock_id);
        // Get first price (lowest) from sorted set
        const prices = await redis.zrange(pricesKey, 0, 0);
        
        if (!prices || prices.length === 0) {
            return null;
        }
        
        const bestPrice = parseFloat(prices[0]);
        
        // If user_id is provided, make sure the best price is not from the same user
        if (user_id) {
            const priceKey = this.getPriceKey(stock_id, bestPrice);
            const orders = await redis.lrange(priceKey, 0, -1);
            
            // Find the first order not from the same user
            for (const orderJson of orders) {
                const order = JSON.parse(orderJson);
                if (order.user_id !== user_id) {
                    return bestPrice;
                }
            }
            
            // If all orders at the best price are from the same user, get next best price
            const nextPrices = await redis.zrange(pricesKey, 1, 1);
            return nextPrices.length ? parseFloat(nextPrices[0]) : null;
        }
        
        return bestPrice;
    }

    async getAllBestPrices() {
        const stocks = await this.getAllStocks();
        const bestPrices = [];
        
        for (const stock_id of stocks) {
            const bestPrice = await this.getBestPrice(stock_id);
            if (bestPrice !== null) {
                const priceKey = this.getPriceKey(stock_id, bestPrice);
                const orders = await redis.lrange(priceKey, 0, 0);
                if (orders && orders.length > 0) {
                    const order = JSON.parse(orders[0]);
                    bestPrices.push({
                        "stock_id": order.stock_id,
                        "best_price": bestPrice
                    });
                }
            }
        }
        
        return bestPrices;
    }

    async getStockOrderBook(stock_id) {
        // Add stock_id to the set of stocks if it doesn't exist
        await redis.sadd(this.getStocksKey(), stock_id);
        return stock_id;
    }

    async getStockOrderBookIfExists(stock_id) {
        const exists = await redis.sismember(this.getStocksKey(), stock_id);
        return exists ? stock_id : null;
    }

    async isStockOrderBookEmpty(stock_id) {
        const pricesKey = this.getStockPricesKey(stock_id);
        const count = await redis.zcard(pricesKey);
        return count === 0;
    }

    async getAllOrders(stock_id) {
        const pricesKey = this.getStockPricesKey(stock_id);
        const prices = await redis.zrange(pricesKey, 0, -1);
        let allOrders = [];
        
        for (const price of prices) {
            const priceKey = this.getPriceKey(stock_id, price);
            const ordersJson = await redis.lrange(priceKey, 0, -1);
            const orders = ordersJson.map(json => JSON.parse(json));
            allOrders = allOrders.concat(orders);
        }
        
        return allOrders;
    }

    async getOrdersAtPrice(stock_id, price) {
        const priceKey = this.getPriceKey(stock_id, price);
        return await redis.lrange(priceKey, 0, -1);
    }

    async addBuyOrder(order) {
        this.validateOrder(order);

        // Ensure buy orders are only MARKET orders
        if (order.order_type !== 'MARKET') {
            throw new Error('Buy orders must be of type MARKET');
        }

        // Get stock
        await this.getStockOrderBook(order.stock_id);
        
        while (order.remaining_quantity > 0) {
            const bestPrice = await this.getBestPrice(order.stock_id, order.user_id);
            if (!bestPrice) throw new Error('No sell orders available');

            const ordersJson = await this.getOrdersAtPrice(order.stock_id, bestPrice);
            if (!ordersJson.length) throw new Error('No sell orders available 2');

            // Get the first valid sell order (different user)
            let sellOrder = null;
            let sellOrderIndex = -1;
            
            for (let i = 0; i < ordersJson.length; i++) {
                const so = JSON.parse(ordersJson[i]);
                if (so.user_id !== order.user_id) {
                    sellOrder = so;
                    sellOrderIndex = i;
                    break;
                }
            }
            
            if (!sellOrder) throw new Error('No sell orders available 3');

            // For market orders, any price is acceptable
            const matchQuantity = Math.min(order.remaining_quantity, sellOrder.remaining_quantity);

            // Execute the trade
            await this.executeTrade(order, sellOrder, matchQuantity);

            // Update quantities
            order.remaining_quantity -= matchQuantity;
            sellOrder.remaining_quantity -= matchQuantity;

            // Update order status
            order.order_status = order.remaining_quantity === 0 ? 'COMPLETED' : 'PARTIALLY_COMPELTE';

            if (sellOrder.remaining_quantity === 0) {
                const parentStockTx = await Stock_Tx.findById(sellOrder.stock_tx_id);
                parentStockTx.order_status = 'COMPLETED';
                await parentStockTx.save();
                
                // Remove the completed sell order from Redis
                const priceKey = this.getPriceKey(order.stock_id, bestPrice);
                await redis.lrem(priceKey, 1, ordersJson[sellOrderIndex]);
                
                // If no more orders at this price, remove the price from the sorted set
                if (await redis.llen(priceKey) === 0) {
                    await redis.zrem(this.getStockPricesKey(order.stock_id), bestPrice.toString());
                }
            } else {
                // Update the sell order in Redis
                const priceKey = this.getPriceKey(order.stock_id, bestPrice);
                await redis.lset(priceKey, sellOrderIndex, JSON.stringify(sellOrder));
            }
        }

        return true;
    }

    async addSellOrder(order) {
        this.validateOrder(order);

        // Add stock_id to the set of stocks
        await this.getStockOrderBook(order.stock_id);
        
        // Add price to the sorted set for this stock (lowest price first)
        const pricesKey = this.getStockPricesKey(order.stock_id);
        await redis.zadd(pricesKey, order.price, order.price.toString());
        
        // Add order to the list of orders at this price
        const priceKey = this.getPriceKey(order.stock_id, order.price);
        await redis.rpush(priceKey, JSON.stringify(order));

        return true;
    }

    async cancelOrder(orderData) {
        const stockBook = await this.getStockOrderBookIfExists(orderData.stock_id);
        if (!stockBook) {
            return false;
        }
        
        const pricesKey = this.getStockPricesKey(orderData.stock_id);
        const prices = await redis.zrange(pricesKey, 0, -1);
        
        for (const price of prices) {
            const priceKey = this.getPriceKey(orderData.stock_id, price);
            const ordersJson = await redis.lrange(priceKey, 0, -1);
            
            for (let i = 0; i < ordersJson.length; i++) {
                const order = JSON.parse(ordersJson[i]);
                
                if (order.user_id === orderData.user_id && order.stock_tx_id === orderData.stock_tx_id) {
                    if (order.is_buy !== false || order.order_type !== 'LIMIT' || order.order_status === 'COMPLETED') {
                        return false;
                    }
                    
                    const remaining_quantity = order.remaining_quantity;
                    
                    // Remove the order from Redis
                    await redis.lrem(priceKey, 1, ordersJson[i]);
                    
                    // If no more orders at this price, remove the price from the sorted set
                    if (await redis.llen(priceKey) === 0) {
                        await redis.zrem(pricesKey, price);
                    }
                    
                    // Update the stock transaction in Stock_Tx DB
                    const stockTx = await Stock_Tx.findById(orderData.stock_tx_id);
                    stockTx.order_status = 'CANCELLED';
                    await stockTx.save();
                    
                    // Update or create user stock
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
            }
        }
        
        return false;
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

        // Add trade to Redis
        await redis.rpush(this.getTradesKey(), JSON.stringify(trade));

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

async function startConsumer() {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue('buy_orders', { durable: true });
    await channel.assertQueue('sell_orders', { durable: true });
    await channel.assertQueue('cancel_orders', { durable: true });

    console.log('Waiting for orders...');
    
    const orderBook = new OrderBook();

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
                console.log('Processing sell order:', order);

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
                console.log('Processing cancel order:', orderData);

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