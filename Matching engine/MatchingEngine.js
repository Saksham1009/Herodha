const OrderBook = require('./orderBook');
const orderBook = new OrderBook();

// Function to process an order
function processOrder(order) {
  console.log('Processing order:', order);

  if (order.order_type === 'MARKET') {
    processMarketOrder(order);
  } else if (order.order_type === 'LIMIT') {
    processLimitOrder(order);
  }
}

// Process a market order
function processMarketOrder(order) {
  if (order.is_buy) {
    // Market buy order: match against the best sell order
    while (order.quantity > 0 && orderBook.getBestSellOrder()) {
      const bestSellOrder = orderBook.getBestSellOrder();
      const matchedQuantity = Math.min(order.quantity, bestSellOrder.quantity);

      // Execute the trade
      executeTrade(order, bestSellOrder, matchedQuantity);

      // Update remaining quantities
      order.quantity -= matchedQuantity;
      bestSellOrder.quantity -= matchedQuantity;

      // Remove the sell order if fully matched
      if (bestSellOrder.quantity === 0) {
        orderBook.removeOrder(bestSellOrder._id.toString());
      }
    }
  } else {
    // Market sell order: match against the best buy order
    while (order.quantity > 0 && orderBook.getBestBuyOrder()) {
      const bestBuyOrder = orderBook.getBestBuyOrder();
      const matchedQuantity = Math.min(order.quantity, bestBuyOrder.quantity);

      // Execute the trade
      executeTrade(bestBuyOrder, order, matchedQuantity);

      // Update remaining quantities
      order.quantity -= matchedQuantity;
      bestBuyOrder.quantity -= matchedQuantity;

      // Remove the buy order if fully matched
      if (bestBuyOrder.quantity === 0) {
        orderBook.removeOrder(bestBuyOrder._id.toString());
      }
    }
  }

  // Add the remaining order to the order book if it's a limit order
  if (order.quantity > 0 && order.order_type === 'LIMIT') {
    orderBook.addOrder(order);
  }
}

// Process a limit order
function processLimitOrder(order) {
  if (order.is_buy) {
    // Limit buy order: match against the best sell order
    while (
      order.quantity > 0 &&
      orderBook.getBestSellOrder() &&
      orderBook.getBestSellOrder().price <= order.price
    ) {
      const bestSellOrder = orderBook.getBestSellOrder();
      const matchedQuantity = Math.min(order.quantity, bestSellOrder.quantity);

      // Execute the trade
      executeTrade(order, bestSellOrder, matchedQuantity);

      // Update remaining quantities
      order.quantity -= matchedQuantity;
      bestSellOrder.quantity -= matchedQuantity;

      // Remove the sell order if fully matched
      if (bestSellOrder.quantity === 0) {
        orderBook.removeOrder(bestSellOrder._id.toString());
      }
    }
  } else {
    // Limit sell order: match against the best buy order
    while (
      order.quantity > 0 &&
      orderBook.getBestBuyOrder() &&
      orderBook.getBestBuyOrder().price >= order.price
    ) {
      const bestBuyOrder = orderBook.getBestBuyOrder();
      const matchedQuantity = Math.min(order.quantity, bestBuyOrder.quantity);

      // Execute the trade
      executeTrade(bestBuyOrder, order, matchedQuantity);

      // Update remaining quantities
      order.quantity -= matchedQuantity;
      bestBuyOrder.quantity -= matchedQuantity;

      // Remove the buy order if fully matched
      if (bestBuyOrder.quantity === 0) {
        orderBook.removeOrder(bestBuyOrder._id.toString());
      }
    }
  }

  // Add the remaining order to the order book
  if (order.quantity > 0) {
    orderBook.addOrder(order);
  }
}

// Execute a trade between two orders
function executeTrade(buyOrder, sellOrder, quantity) {
  console.log(`Trade executed: ${quantity} shares at ${sellOrder.price}`);
  // TODO: Update database with the trade details (e.g., update wallet, stock portfolio)
}

module.exports = { processOrder };