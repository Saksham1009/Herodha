require('dotenv').config();
const express = require('express');
const connectToDB = require('./config/dbConnect');
const app = express();

const cors = require('cors');
app.use(cors());

app.use(express.json());

connectToDB();

app.use('/', require('./routes/admin'));

const PORT = process.env.PORT || 3003;

app.listen(PORT);