require('dotenv').config();
const amqp = require('amqplib');
const connectToDB = require('./config/dbConnect');
const Stock_Tx = require('./model/Stock_Tx');
const Stock = require('./model/Stock');
const Wallet_Tx = require('./model/Wallet_Tx');
const User_Stocks = require('./model/User_Stocks');
const User = require('./model/User');

const express = require('express');
const app = express();
app.use(express.json());
connectToDB();

const { OrderBook } = require('./orderBook');
const orderBook = new OrderBook();

const startConsumer = require('./consumer');
startConsumer(orderBook);

const routes = require('./routes')(orderBook);
app.use(routes);

app.listen(3004, () => {
    console.log('Server listening on port 3004');
});