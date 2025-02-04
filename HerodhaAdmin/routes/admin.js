const express = require('express');
const router = express.Router();
const Stock = require('./../../model/Stock');
const User_Stocks = require('./../../model/User_Stocks');
const User = require('./../../model/User'); 

const app = express();
app.use(express.json());

// Create a stock
router.post('/createStock', async (req, res) => {

    const stock = new Stock({
        stock_name: req.body.stock_name
    });

    try {
        const newStock = await stock.save();
        // Return success response with `stock_id`
        res.status(201).json({
            success: true,
            data: {
                stock_id: newStock._id // using MongoDB's default '_id'
            }
        });  
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


// add Stock to User

router.post('/addStockToUser', async (req, res) => {

    try {
        const stock_id = req.body.stock_id;
        const quantity = req.body.quantity;

        const userId = req.user.userId; // extracts the userId from the token payload

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
                stock_id, 
                quantity_owned: quantity
            });
        }

        
        await userStock.save(); // automatically updates created_at and updated_at with date.now time
        // returns success response
        res.status(201).json({success: true, data: null});
    } catch (err){
        console.error("Error adding stock to user", err);
        res.status(500).json({success: false, message: "Internal Server Error"});
    }

});


// Add money to wallet
router.post('/addMoneyToWallet', async (req, res) => {
    try {

        const amount = req.body.amount;

        // Validate if amount entered in valid
        if (amount === undefined || amount <= 0) {
            return res.status(400).json({ success: false, message: "Amount must be a positive number" });
        }

        const username = req.user.username; // Extract username from token payload

        const user = await User.findOne({ user_name: username }); // // Find the user by username
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

    
        user.balance += amount;  // Update the user's balance
        await user.save();

        // Return success response
        res.status(201).json({ success: true, data: null });

    } catch (err) {
        console.error("Error adding money to wallet:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

module.exports = router;