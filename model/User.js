const mongoose = require('mongoose');
const crypto = require('crypto');
const { v4: uuidv4 } = require("uuid");

const UserCollection = new mongoose.Schema({

    user_id: { 
        type: String, 
        unique: true, 
        default: uuidv4 
    },
    user_name: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    password: {
        hash: {
            type: String
        },
        salt: {
            type: String
        }
    },
    created_at: {
        type: Date,
        required: true,
        default: Date.now
    },
    balance: {
        type: Number,
        required: true,
        default: 0
    }
});

const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString('hex');

    const hash = crypto
        .createHmac('sha256', salt)
        .update(password)
        .digest('hex');

    return { salt, hash };
};

const verifyPassword = (password, salt, storedHash) => {
    const hash = crypto
        .createHmac('sha256', salt)
        .update(password)
        .digest('hex');

    return hash === storedHash;
};

UserCollection.methods.setPassword = function (password) {
    const { salt, hash } = hashPassword(password);
    this.password.salt = salt;
    this.password.hash = hash;
};

UserCollection.methods.verifyPassword = function (password) {
    return verifyPassword(password, this.password.salt, this.password.hash);
};

module.exports = mongoose.model('User', UserCollection);