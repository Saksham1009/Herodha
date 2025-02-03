const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const User = require('../model/User');

app.use(express.json());

const router = express.Router();

router.post('/register', async (req, res) => {
    const username = req.body.username;
    const name = req.body.name;
    const password = req.body.password;

    if (!username || !name || !password) {
        res.status(400).json({
            "success": false,
            "data": {
                "error": "Please provide all the required fields"
            }
        });
    }

    try {
        let user = await User.findOne({ username: username });
        if (user) {
            res.status(400).json({
                "success": false,
                "data": {
                    "error": "User with this username already exists"
                }
            });
        }

        user = new User({
            username: username,
            name: name
        });

        user.setPassword(password);

        await user.save();

        res.status(200).json({
            "success": true,
            "data": null
        });
    } catch (error) {
        res.status(500).json({
            "success": false,
            "data": {
                "error": "There seems to be an error" + error
            }
        });
    }
});

// Still need ot implement the code to refresh the token after expiry or do we not need that???

router.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    try {
        const user = await User.findOne({ username: username });
        if (!user || !user.verifyPassword(password)) {
            return res.status(400).json({
                "success": false,
                "data": {
                    "error": "Invalid username or password"
                }
            });
        }

        const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY });
        res.json({
            "success": true,
            "data": {
                "token": token
            }
        });
    } catch (error) {
        res.status(500).json({
            "success": false,
            "data": {
                "error": "There seems to be an error" + error
            }
        });
    }
});

module.exports = router;