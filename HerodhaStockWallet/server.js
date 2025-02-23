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

app.use('/transaction/getStockPortfolio', PortfolioHandler);
app.use('/transaction/getWalletTransactions', WalletTxHandler);
app.use('/transaction/getStockTransactions', StockTxHandler);
app.use('/transaction/getWalletBalance', WalletBalanceHandler);

const PORT = process.env.PORT || 3002;

app.listen(PORT);