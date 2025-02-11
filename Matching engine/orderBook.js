class OrderBook {
    constructor() {
      this.buyOrders = []; // Priority queue for buy orders (sorted by highest price)
      this.sellOrders = []; // Priority queue for sell orders (sorted by lowest price)
      this.orderIndex = new Map(); // Quick order lookup by order ID
    }
  
    // Add a new order to the order book
    addOrder(order) {
      if (order.is_buy) {
        this.buyOrders.push(order);
        this.buyOrders.sort((a, b) => b.price - a.price); // Sort buy orders by highest price
      } else {
        this.sellOrders.push(order);
        this.sellOrders.sort((a, b) => a.price - b.price); // Sort sell orders by lowest price
      }
      this.orderIndex.set(order._id.toString(), order); // Add to order index
    }
  
    // Remove an order from the order book
    removeOrder(orderId) {
      const order = this.orderIndex.get(orderId);
      if (!order) return;
  
      if (order.is_buy) {
        this.buyOrders = this.buyOrders.filter((o) => o._id.toString() !== orderId);
      } else {
        this.sellOrders = this.sellOrders.filter((o) => o._id.toString() !== orderId);
      }
      this.orderIndex.delete(orderId); // Remove from order index
    }
  
    // Get the best buy order (highest price)
    getBestBuyOrder() {
      return this.buyOrders.length > 0 ? this.buyOrders[0] : null;
    }
  
    // Get the best sell order (lowest price)
    getBestSellOrder() {
      return this.sellOrders.length > 0 ? this.sellOrders[0] : null;
    }
  }
  
  module.exports = OrderBook;