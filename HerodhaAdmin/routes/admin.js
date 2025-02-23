const express = require('express');
const router = express.Router();
const Stock = require('./../model/Stock');
const User_Stocks = require('./../model/User_Stocks');
const User = require('./../model/User'); 
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Extract Credentials using custom header 'token'
const extractCredentials = (req) => {
    const token = req.headers.token; // Using custom header 'token'
    if (!token) {
        return null;
    }
    const decoded = jwt.decode(token); // Directly decode the token without splitting
    return decoded;
};


// Create a stock
router.post('/setup/createStock', async (req, res) => {

    const stock = new Stock({
        stock_name: req.body.stock_name
    });

    try {
        const newStock = await stock.save();
        // Return success response with `stock_id`
        return res.status(201).json({
            success: true,
            data: {
                stock_id: newStock._id // using MongoDB's default '_id'
            }
        });  
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
});


// add Stock to User

router.post('/setup/addStockToUser', async (req, res) => {

    try {
        const stock_id = req.body.stock_id;
        const quantity = Number(req.body.quantity);

        const credentials = extractCredentials(req);

        const userId = credentials["userId"]; // extracts the userId from the token payload

        // check if stock exists 
        const stock = await Stock.findById(stock_id);
        if (!stock) {
            return res.status(404).json({success: false, message: "Stock not found"});
        }

        // check if user already owns the stock 

        let userStock = await User_Stocks.findOne({user_id: userId, stock_id});

        // if user stocks exists
        if (userStock){
            userStock.quantity_owned += quantity;
            userStock.updated_at = Date.now();
        } else {
            // create new user stock entry
            userStock = new User_Stocks({
                user_id: userId, 
                stock_name: stock.stock_name,
                stock_id: stock_id, 
                quantity_owned: quantity
            });
        }
        
        await userStock.save(); // automatically updates created_at and updated_at with date.now time
        // returns success response
        return res.status(201).json({success: true, data: null});
    } catch (err){
        console.error("Error adding stock to user", err);
        return res.status(500).json({success: false, message: err});
    }

});


// Add money to wallet
router.post('/transaction/addMoneyToWallet', async (req, res) => {
    try {

        const amount = Number(req.body.amount);

        // Validate if amount entered in valid
        if (amount === undefined || amount < 0) {
            return res.status(400).json({ "success": false, "data": {"error": "Amount must be a positive number" }});
        }

        const credentials = extractCredentials(req);

        const username = credentials.username; // Extract username from token payload

        const user = await User.findOne({ user_name: username }); // // Find the user by username
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

    
        user.balance += amount;  // Update the user's balance

        await user.save();

        // Return success response
        return res.status(201).json({ success: true, data: null });
    } catch (err) {
        console.error("Error adding money to wallet:", err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

module.exports = router;