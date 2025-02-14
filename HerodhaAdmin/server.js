require('dotenv').config();
const express = require('express');
const connectToDB = require('./config/dbConnect');
const app = express();
app.use(express.json());

connectToDB();

app.use('/admin', require('./routes/admin'));

const PORT = process.env.PORT || 3003;

app.listen(PORT);