require('dotenv').config();
const express = require('express');
const connectToDB = require('../config/dbConnect');
const app = express();

app.use(express.json());

connectToDB();

app.use('/auth', require('./routes/auth'));

const PORT = process.env.PORT || 3000;

app.listen(PORT);