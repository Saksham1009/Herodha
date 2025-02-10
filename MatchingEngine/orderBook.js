// maintains the order book and executes trades

const OrderBook = { buy: [], sell: [] };
const User = require('./../model/User');
const StockTx = require('./../model/Stock_Tx');

async function processOrder(order) {
    if (order.is_buy) {
        OrderBook.buy.push(order);
        OrderBook.buy.sort((a, b) => b.price - a.price || a.timestamp - b.timestamp);
    } else {
        OrderBook.sell.push(order);
        OrderBook.sell.sort((a, b) => a.price - b.price || a.timestamp - b.timestamp);
    }

    matchOrders();
}

async function matchOrders() {
    while (OrderBook.buy.length > 0 && OrderBook.sell.length > 0) {
        const highestBid = OrderBook.buy[0];
        const lowestAsk = OrderBook.sell[0];

        if (highestBid.price >= lowestAsk.price) {
            const tradePrice = (highestBid.price + lowestAsk.price) / 2;
            const quantity = Math.min(highestBid.quantity, lowestAsk.quantity);

            await executeTrade(highestBid, lowestAsk, tradePrice, quantity);

            highestBid.quantity -= quantity;
            lowestAsk.quantity -= quantity;

            if (highestBid.quantity === 0) OrderBook.buy.shift();
            if (lowestAsk.quantity === 0) OrderBook.sell.shift();
        } else {
            break;
        }
    }
}

async function executeTrade(buyOrder, sellOrder, tradePrice, quantity) {
    console.log(`Trade Executed: ${quantity} shares at $${tradePrice}`);

    await StockTx.create({
        stock_id: buyOrder.stock_id,
        user_id: buyOrder.user_id,
        quantity,
        price: tradePrice,
        is_buy: true,
        order_status: "COMPLETED",
        timestamp: new Date(),
    });

    await StockTx.create({
        stock_id: sellOrder.stock_id,
        user_id: sellOrder.user_id,
        quantity,
        price: tradePrice,
        is_buy: false,
        order_status: "COMPLETED",
        timestamp: new Date(),
    });

    await updateUserHoldings(buyOrder.user_id, sellOrder.user_id, buyOrder.stock_id, quantity, tradePrice);
}

async function updateUserHoldings(buyerId, sellerId, stockId, quantity, price) {
    const buyer = await User.findById(buyerId);
    const seller = await User.findById(sellerId);

    buyer.wallet.balance -= quantity * price;
    seller.wallet.balance += quantity * price;

    if (!buyer.stocks[stockId]) buyer.stocks[stockId] = 0;
    buyer.stocks[stockId] += quantity;

    seller.stocks[stockId] -= quantity;
    
    await buyer.save();
    await seller.save();
}

module.exports = { processOrder };
