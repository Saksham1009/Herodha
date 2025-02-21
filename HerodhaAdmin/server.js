require('dotenv').config();
const express = require('express');
const connectToDB = require('./config/dbConnect');
const app = express();
app.use(express.json());
const cors = require('cors');
app.use(cors());

connectToDB();

app.use('/admin', require('./routes/admin'));

const PORT = process.env.PORT || 3003;

app.listen(PORT);