// This file is responsible for consuming messages from the RabbitMQ server and processing them.

const amqp = require('amqplib');

module.exports = async function startConsumer(orderBook) {
    const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq';

    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();
        await channel.assertQueue('buy_orders', { durable: true });
        await channel.assertQueue('sell_orders', { durable: true });
        await channel.assertQueue('cancel_orders', { durable: true });

        console.log('Waiting for orders...');

        channel.consume('buy_orders', async (message) => {
            if (message) {
                try {
                    const orderData = JSON.parse(message.content.toString());
                    const { Order } = require('./orderBook');
                    const order = new Order(
                        orderData.stock_id,
                        orderData.user_id,
                        orderData.is_buy,
                        orderData.order_type,
                        orderData.quantity,
                        orderData.price
                    );
                    console.log('Processing buy order:', order);
                    channel.ack(message);
                    await orderBook.addBuyOrder(order);
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
                    const { Order } = require('./orderBook');
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
                    orderBook.addSellOrder(order);
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
    } catch (error) {
        console.error('Error starting consumer:', error);
    }
};
