const express = require('express');
const app = express();
const JWT = require('jsonwebtoken');
const User = require('./../../model/User');

app.use(express.json());

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const decoded = JWT.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const user = await User.findById(userId);

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