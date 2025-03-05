const express = require('express');

module.exports = function(orderBook) {
    const router = express.Router();

    router.get('/engine/getAvailableStocks', async (req, res) => {
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

    router.get('/engine/getPrice', (req, res) => {
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

    router.post('/', (req, res) => {
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

    return router;
};
