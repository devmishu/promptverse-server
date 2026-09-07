const { sessions, users } = require('../config/db');

// Refactored from index.js. Existing auth logic remains unchanged.
const verifyToken = async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) {
        return res.status(401).send({
            message: "Unauthorize acsess"
        });
    }

    const token = header.split(' ')[1];

    console.log("user token:", token);

    if (!token) {
        return res.status(401).send({
            message: "Unauthorize acsess"
        });
    }

    const query = { token: token };
    const session = await sessions.findOne(query);

    const userId = session?.userId;

    const userQuary = {
        _id: userId
    };
    const user = await users.findOne(userQuary);

    req.user = user;

    next();
};

const verifyUser = (req, res, next) => {
    if (req.user?.role !== "user") {
        return res.status(403).send({ message: "Forbidden accsess" });
    }
    next();
};

const verifyCreator = (req, res, next) => {
    if (req.user?.role !== "creator") {
        return res.status(403).send({ message: "Forbidden accsess" });
    }
    next();
};

const verifyAdmin = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return res.status(403).send({ message: "Forbidden accsess" });
    }
    next();
};

module.exports = {
    verifyToken,
    verifyUser,
    verifyCreator,
    verifyAdmin
};
