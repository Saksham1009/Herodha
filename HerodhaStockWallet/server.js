require('dotenv').config();
const express = require('express');
const connectToDB = require('./config/dbConnect');
const PortfolioHandler = require('./routes/portfolio');
const StockTxHandler = require('./routes/stocktx');
const WalletTxHandler = require('./routes/wallettx');
const WalletBalanceHandler = require('./routes/walletbalance');
const app = express();

app.use(express.json());

connectToDB();

app.use('/stock/getStockPortfolio', PortfolioHandler);
app.use('/wallet/getWalletTransactions', WalletTxHandler);
app.use('/stock/getStockTransactions', StockTxHandler);
app.use('/wallet/getWalletBalance', WalletBalanceHandler);

const PORT = process.env.PORT || 3002;

app.listen(PORT);