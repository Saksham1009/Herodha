const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const User = require('./../model/User');

app.use(express.json());

const router = express.Router();

// Extract Credentials using custom header 'token'
const extractCredentials = (req) => {
    const token = req.headers.token; // Using custom header 'token'
    if (!token) {
        return null;
    }
    const decoded = jwt.decode(token); // Directly decode the token without splitting
    return decoded;
};


router.get('/', async (req, res) => {
    try {
        const userId = extractCredentials(req).userId;

        const user = await User.findById(userId);

        if (!user || user.balance === undefined) {
            return res.status(200).json({
              success: true,
              data: { balance: 0 }, // Prevent frontend from crashing
            });
          }

        return res.status(200).json({
            "success": true,
            "data": {
                "balance": user.balance
            }
        });
    } catch (error) {
        return res.status(401).json({
            "success": false,
            "data": {
                "error": "There seems to be an error " + error
            }
        });
    }
});

module.exports = router;