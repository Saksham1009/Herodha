const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Extract the token from a custom header named 'token'
    const token = req.headers.token; // Accessing the token directly from a custom header

    if (!token) {
        return res.status(401).json({ message: 'Access Denied, no token given' });
    }

    try {
        // Assuming the token does not come with a 'Bearer ' prefix since it's a custom implementation
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        console.log(verified); // Optionally, remove console logs in production for security
        req.user = verified;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid Token' });
    }
};

module.exports = verifyToken;
