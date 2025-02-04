const express = require('express');
const app = express();
const User = require('./../../model/User');

app.use(express.json());

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const userId = req.user.userId;

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