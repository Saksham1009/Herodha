require('dotenv').config();
const express = require('express');
const connectToDB = require('../config/dbConnect');
const PortfolioHandler = require('./routes/portfolio');
const StockTxHandler = require('./routes/stocktx');
const WalletTxHandler = require('./routes/wallettx');
const WalletBalanceHandler = require('./routes/walletbalance');
const app = express();

app.use(express.json());

connectToDB();

app.use('/getStockPortfolio', PortfolioHandler);
app.use('/getWalletTransactions', WalletTxHandler);
app.use('/getStockTransactions', StockTxHandler);
app.use('/getWalletBalance', WalletBalanceHandler);

const PORT = process.env.PORT || 3002;

app.listen(PORT);