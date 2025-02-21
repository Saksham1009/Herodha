require('dotenv').config();
const express = require('express');
const connectToDB = require('./config/dbConnect');
const AuthHandler = require('./routes/auth');
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());

connectToDB();

app.use('/authentication', AuthHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT);