const amqp = require('amqplib');
const dotenv = require('dotenv');
dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const QUEUE_NAME = 'order_queue';

async function sendOrderToQueue(order) {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    // Assert the queue exists
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    // Send the order to the queue
    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(order)), {
      persistent: true // Ensure messages are saved to disk
    });

    console.log(`Order sent to queue: ${JSON.stringify(order)}`);

    // Close the connection
    setTimeout(() => {
      connection.close();
    }, 500);
  } catch (err) {
    console.error('Error sending order to queue:', err);
  }
}

module.exports = { sendOrderToQueue };