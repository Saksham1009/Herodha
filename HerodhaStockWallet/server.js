/*
require('dotenv').config();
const express = require('express');
const connectToDB = require('./config/dbConnect');
const PortfolioHandler = require('./routes/portfolio');
const StockTxHandler = require('./routes/stocktx');
const WalletTxHandler = require('./routes/wallettx');
const WalletBalanceHandler = require('./routes/walletbalance');
const app = express();
const cors = require('cors');

app.use(express.json());
app.use(cors({
    origin: "http://localhost:3006"
}));

connectToDB();

app.use('/transaction/getStockPortfolio', PortfolioHandler);
app.use('/transaction/getWalletTransactions', WalletTxHandler);
app.use('/transaction/getStockTransactions', StockTxHandler);
app.use('/transaction/getWalletBalance', WalletBalanceHandler);

const PORT = process.env.PORT || 3002;

app.listen(PORT);
*/
require('dotenv').config();
const express = require('express');
const connectToDB = require('./config/dbConnect');
const PortfolioHandler = require('./routes/portfolio');
const StockTxHandler = require('./routes/stocktx');
const WalletTxHandler = require('./routes/wallettx');
const WalletBalanceHandler = require('./routes/walletbalance');

const app = express();
const cors = require('cors');
app.use(cors());

app.use(express.json()); // Parse JSON bodies


connectToDB(); // Connect to your database

// Define your API routes
app.use('/stock/getStockPortfolio', PortfolioHandler);
app.use('/wallet/getWalletTransactions', WalletTxHandler);
app.use('/stock/getStockTransactions', StockTxHandler);
app.use('/wallet/getWalletBalance', WalletBalanceHandler);

const PORT = process.env.PORT || 3002;
app.listen(PORT);