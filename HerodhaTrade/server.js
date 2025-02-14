require('dotenv').config();
const express = require('express');
const connectToDB = require('./config/dbConnect');
const handler = require('./routes/trade.js');
const app = express();

app.use(express.json());

connectToDB();

app.use('/trade/', handler);

const PORT = process.env.PORT || 3001;

app.listen(PORT);