const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const User = require('./../model/User');
const verifyToken = require('../JWTmiddleware');
app.use(express.json());

const router = express.Router();

router.get('/verify-token', verifyToken, (req, res) => {
    res.status(200).json({
        "success": true,
        "data": null
    });
});

router.post('/register', async (req, res) => {
    const username = req.body.user_name;
    const name = req.body.name;
    const password = req.body.password;

    if (!username || !name || !password) {
        return res.status(400).json({
            "success": false,
            "data": {
                "error": "Please provide all the required fields"
            }
        });
    }

    try {
        //now this will only be a preemptive check
        let user = await User.findOne({ username: username });
        if (user) {
            return res.status(400).json({
                "success": false,
                "data": {
                    "error": "User with this username already exists"
                }
            });
        }

        user = new User({
            user_name: username,
            name: name
        });

        user.setPassword(password);

        await user.save();

        return res.status(200).json({
            "success": true,
            "data": null
        });
    } catch (error) {
        // Handle MongoDB duplicate key error
        if (error.name === 'MongoServerError' && error.code === 11000) {
            return res.status(400).json({
                "success": false,
                "data": {
                    "error": "User with this username already exists"
                }
            });
        } else {
            // Handle other errors
            return res.status(500).json({
                "success": false,
                "data": {
                    "error": "There seems to be an error: " + error.message
                }
            });
        }
    }
});

// Still need ot implement the code to refresh the token after expiry or do we not need that???

router.post('/login', async (req, res) => {
    const username = req.body.user_name;
    const password = req.body.password;

    try {
        const user = await User.findOne({ user_name: username });
        if (!user || !user.verifyPassword(password)) {
            return res.status(400).json({
                "success": false,
                "data": {
                    "error": "Invalid username or password"
                }
            });
        }

        const token = jwt.sign({ userId: user._id, username: user.user_name }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY });
        return res.json({
            "success": true,
            "data": {
                "token": token
            }
        });
    } catch (error) {
        return res.status(500).json({
            "success": false,
            "data": {
                "error": "There seems to be an error" + error
            }
        });
    }
});

module.exports = router;
