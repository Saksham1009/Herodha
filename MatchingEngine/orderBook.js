// Description: This file contains the implementation of the OrderBook class which is used to manage the order book for the stock exchange. It uses a priority queue to store the orders and executes trades between buy and sell orders.
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
            this.stockOrderBooks.set(stock_id, new PriorityQueue((a, b) => a < b));
        }
        return this.stockOrderBooks.get(stock_id);
    }

    async addBuyOrder(order) {
        this.validateOrder(order);

        // Ensure buy orders are only MARKET orders
        if (order.order_type !== 'MARKET') {
            throw new Error('Buy orders must be of type MARKET');
        }

        const orderBook = this.getStockOrderBook(order.stock_id);

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
        sellOrder.remaining_quantity -= matchQuantity;

        // Update order status
        order.order_status = order.remaining_quantity === 0 ? 'COMPLETED' : 'PARTIALLY_COMPELTE';

        console.log("Yaha pohonch gaue");

        if (sellOrder.remaining_quantity === 0) {
            const Stock_Tx = require('./model/Stock_Tx');
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

        return order.remaining_quantity === 0;
    }

    addSellOrder(order) {
        this.validateOrder(order);

        const orderBook = this.getStockOrderBook(order.stock_id);
        orderBook.enqueue(order.price, order);
        this.orderIndex.set(order.stock_id + '_' + order.user_id, order);

        return true;
    }

    async cancelOrder(orderData) {
        const orderId = orderData.stock_id + '_' + orderData.user_id;
        const order = this.orderIndex.get(orderId);
        if (!order) return false;

        if (order.is_buy !== false || order.order_type !== 'LIMIT' || order.order_status === 'COMPLETED') {
            return;
        }

        order.order_status = "CANCELLED";
        this.orderIndex.delete(orderId);

        // Remove from order book
        const orderBook = this.getStockOrderBook(stock_id);
        const orders = orderBook.getOrdersAtPrice(order.price);
        if (orders) {
            const index = orders.findIndex(o => o.user_id === orderData.user_id);
            if (index !== -1) {
                orders.splice(index, 1);
            }
        }

        // update the stock transaction in Stock_Tx DB
        const Stock_Tx = require('./model/Stock_Tx');
        const stockTx = await Stock_Tx.findById(orderData.stock_tx_id);
        
        stockTx.order_status = 'CANCELLED';
        await stockTx.save();

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
        const Stock_Tx = require('./model/Stock_Tx');
        const Wallet_Tx = require('./model/Wallet_Tx');
        const User_Stocks = require('./model/User_Stocks');
        const Stock = require('./model/Stock');
        const User = require('./model/User');

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

module.exports = {
    PriorityQueue,
    Order,
    OrderBook
};
