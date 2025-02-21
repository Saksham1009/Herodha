const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const User = require('./../model/User');

app.use(express.json());

const router = express.Router();

const extractCredentials = (req) => {
    const token = req.header('Authorization');
    if (!token) {
        return null;
    }
    const decoded = jwt.decode(token.split(' ')[1]);
    return decoded;
}

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