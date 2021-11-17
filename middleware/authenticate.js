const jwt = require("jsonwebtoken");
const walkConfig = require("../config.js");
const db = require("../dbConnectExec.js");

const auth = async (req, res, next) => {
  // console.log("in the middleware", req.header("Authorization"));
  // next();

  try {
    //1. decode token

    let myToken = req.header("Authorization").replace("Bearer ", "");
    // console.log(myToken);

    let decoded = jwt.verify(myToken, walkConfig.JWT);
    console.log(decoded);

    let creatorPK = decoded.pk;

    //2. compare token with database

    let query = `SELECT CreatorPK, NameFirst, NameLast, Username, Email
    From Creator
    Where CreatorPK = ${creatorPK} and Token = '${myToken}'`;

    let returnedUser = await db.executeQuery(query);

    console.log("returned user", returnedUser);

    //3. save user info in request

    if (returnedUser[0]) {
      req.creator = returnedUser[0];
      next();
    } else {
      return res.status(401)("Authentication Failed");
    }
  } catch (err) {
    return res.status(401).send("Authentication Failed");
  }
};

module.exports = auth;
