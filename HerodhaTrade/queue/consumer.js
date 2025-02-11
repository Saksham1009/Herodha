const amqp = require('amqplib');
const dotenv = require('dotenv');
dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const QUEUE_NAME = 'order_queue';

async function startConsumer() {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    // Assert the queue exists
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    console.log('Waiting for orders in the queue...');

    // Consume messages from the queue
    channel.consume(QUEUE_NAME, (message) => {
      if (message !== null) {
        const order = JSON.parse(message.content.toString());
        console.log('Received order:', order);

        // Pass the order to the matching engine
        processOrder(order);

        // Acknowledge the message
        channel.ack(message);
      }
    });
  } catch (err) {
    console.error('Error consuming orders from queue:', err);
  }
}

//NEED TO DO THIS IN MATCHING ENGINE
// also need to start the consumer when matching engine starts: so server.js of Matching engine

// Function to process the order (to be implemented in the matching engine)
function processOrder(order) {
  console.log('Processing order:', order);

}

module.exports = { startConsumer };

