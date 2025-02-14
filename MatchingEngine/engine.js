const amqp = require('amqplib');
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq';

async function startConsumer() {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue('order_queue', { durable: true });

    console.log('Waiting for orders...');

    channel.consume('order_queue', async (message) => {
        if (message) {
            const order = JSON.parse(message.content.toString());
            console.log('Processing order:', order);

            // Call the matching function here
            processOrder(order);

            channel.ack(message);
        }
    });
}

function processOrder(order) {
    console.log('Executing order matching logic...', order);
    
}

startConsumer();