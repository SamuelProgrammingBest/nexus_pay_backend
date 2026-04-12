const jwt = require("jsonwebtoken");

const verifyAccountHolder = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    // 1. Check if header exists
    if (!authorization) {
      return res.status(401).send({ message: "No authorization header found" });
    }


    const token = authorization.startsWith("Bearer ")
      ? authorization.substring(7)
      : authorization;

    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
      if (err) {
        res.status(401).send({
          message: "Not authorized",
        });
        return;
      }

      console.log(decoded);

      req.user = decoded;

      next();
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: "Error occured while verifying" });
  }
};

module.exports = { verifyAccountHolder };
