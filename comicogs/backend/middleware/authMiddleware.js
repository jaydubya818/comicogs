const jwt = require('jsonwebtoken');
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access-secret';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) return res.sendStatus(403);
        req.user = decoded;
        next();
    });
};

const authorizeRole = (role) => {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.sendStatus(403);
        }
        next();
    };
};

module.exports = { authenticateToken, authorizeRole };
