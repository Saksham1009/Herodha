const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');
    // const token = req.headers.token; // confirm this with Pratik bhaiya
    if (!token) return res.status(401).json({ message: 'Access Denied, no token given' });

    try {
        const verified = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
        console.log(verified);
        req.user = verified;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid Token' });
    }
};

module.exports = verifyToken;