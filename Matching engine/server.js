const { startConsumer } = require('./../HerodhaTrade/queue/consumer');
const { processOrder } = require('./matchingEngine');

// Override the processOrder function in the consumer
const originalProcessOrder = processOrder;
processOrder = (order) => {
  originalProcessOrder(order);
};

// Start the RabbitMQ consumer
startConsumer();

console.log('Matching Engine is running...');