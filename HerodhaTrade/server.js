require('dotenv').config();
const express = require('express');
const connectToDB = require('../config/dbConnect');
const app = express();

app.use(express.json());

connectToDB();

app.use('/trade/getStockPrices', StockPricesHandler);
app.use('/trade/placeStockOrder', PlaceStockOrderHandler);
app.use('/trade/cancelStockTransaction', CancelStockTxHandler);

const PORT = process.env.PORT || 3001;

app.listen(PORT);