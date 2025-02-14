const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const WalletTx = require('./../model/Wallet_Tx');

app.use(express.json());

const router = express.Router();

class WalletTxResponse {
    wallet_tx_id;
    stock_tx_id;
    is_debit;
    amount;
    time_stamp;

    constructor(wallet_tx_id, stock_tx_id, is_debit, amount, time_stamp) {
        this.wallet_tx_id = wallet_tx_id;
        this.stock_tx_id = stock_tx_id;
        this.is_debit = is_debit;
        this.amount = amount;
        this.time_stamp = time_stamp;
    }
}

const extractCredentials = (req) => {
    const token = req.header('Authorization');
    if (!token) {
        return null;
    }
    const decoded = jwt.decode(token.split(' ')[1]);
    return decoded;
}

router.post('/', async (req, res) => {
    try {
        const userId = extractCredentials(req).userId;

        const userWalletTx = await WalletTx.find({ user_id: userId });

        const response = userWalletTx.map(walletTx => {
            return new WalletTxResponse(
                walletTx._id,
                walletTx.stock_tx_id,
                walletTx.is_debit,
                walletTx.amount,
                walletTx.time_stamp
            );
        });

        return res.status(200).json({
            "success": true,
            "data": response
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