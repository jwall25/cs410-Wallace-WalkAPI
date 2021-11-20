const express = require("express");
const cors = require("cors");

const bcrypt = require("bcryptjs");

const db = require("./dbConnectExec.js");
const walkConfig = require("./config.js");

const auth = require("./middleware/authenticate");

const app = express();

const jwt = require("jsonwebtoken");

app.use(express.json());
//azurwebsites.net, colostate.edu
app.use(cors());

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`App is running on Port ${PORT}`);
});

app.get("/hi", (req, res) => {
  res.send("hello world");
});

app.get("/", (req, res) => {
  res.send("API is running");
});

// app.post();
// app.put();

app.get("/walkthroughs/me", auth, async (req, res) => {
  try {
    //get contactpk
    let walkCreatorPK = req.creator.CreatorPK;
    //query database for users records
    let query = `SELECT Walkthrough.WalkPK,
  Walkthrough.Title,
  Walkthrough.Summary,
  Walkthrough.Rating,
  Walkthrough.VideoLength,
  Walkthrough.CreatorFK,
  Game.Title AS GameTitle
  From Walkthrough
  Left Join Game
  On Game.GamePK = Walkthrough.GameFK
  Where Walkthrough.CreatorFK = ${walkCreatorPK}`;

    let walkResult = await db.executeQuery(query);
    //send users reviews back to them
    if (!walkResult[0]) {
      res.status(200).send("No Walkthroughs Made");
    } else {
      res.status(200).send(walkResult);
    }
  } catch (err) {
    console.log("error in GET /walkthroughs/me", err);
    res.status(500).send();
  }
});

// app.patch("/reviews/:pk", auth, async (req, res) => {});

// app.delete("/reveiws/:pk");

app.post("/creators/logout", auth, (req, res) => {
  let query = `UPDATE Creator
  Set Token = NULL
  Where CreatorPK = ${req.creator.CreatorPK}`;

  db.executeQuery(query)
    .then(() => {
      res.status(200).send();
    })
    .catch((err) => {
      console.log("error in POST /creators/logout", err);
      res.status(500).send();
    });
});

app.post("/walkthroughs", auth, async (req, res) => {
  try {
    let gameFK = req.body.gameFK;
    let title = req.body.title;
    let summary = req.body.summary;
    let rating = req.body.rating;
    let vidleng = req.body.videolength;

    if (
      !gameFK ||
      !summary ||
      !title ||
      !Number.isInteger(rating) ||
      !Number.isInteger(vidleng)
    ) {
      return res.status(400).send("bad request");
    }

    summary = summary.replace("'", "''");
    // console.log("summary", summary);

    // console.log("here is the creator", req.creator);

    let insertQuery = `INSERT INTO Walkthrough(Title,Summary,Rating,VideoLength,GameFK,CreatorFK)
    OUTPUT inserted.WalkPK, inserted.Title, inserted.Summary, inserted.Rating, inserted.VideoLength, inserted.GameFK
    VALUES('${title}', '${summary}', '${rating}', '${vidleng}', '${gameFK}', '${req.creator.CreatorPK}')`;

    let insertedWalk = await db.executeQuery(insertQuery);

    console.log("inserted walkthrough", insertedWalk);

    res.status(201).send(insertedWalk[0]);
  } catch (err) {
    console.log("error in POST /walkthroughs", err);
    res.status(500).send();
  }
});

app.get("/creators/me", auth, (req, res) => {
  res.send(req.creator);
});

app.post("/creators/login", async (req, res) => {
  console.log("/creators/login called", req.body);
  // 1. data validation

  let email = req.body.email;
  let username = req.body.username;
  let password = req.body.password;

  if (!email || !password || !username) {
    return res.status(400).send("bad Request");
  }

  // 2. check user exists

  let query = `SELECT *
  From Creator
  Where Email = '${email}'`;

  let result;

  try {
    result = await db.executeQuery(query);
  } catch (myError) {
    console.log("error in /creator/login", myError);
    return res.status(500).send();
  }

  console.log(result);

  if (!result[0]) {
    return res.status(401).send("Invalid User Credentials.");
  }
  // 3. check user password

  let user = result[0];

  if (!bcrypt.compareSync(password, user.Password)) {
    console.log("Invalid Password");
    return res.status(401).send("Invalid User Credentials");
  }

  // 4. if good, generate token

  let token = jwt.sign({ pk: user.CreatorPK }, walkConfig.JWT, {
    expiresIn: "60 minutes",
  });

  // console.log("token", token);

  // 5. save token in database and send response back

  let setTokenQuery = `UPDATE Creator
  SET Token = '${token}'
  WHERE CreatorPK = ${user.CreatorPK}`;

  try {
    await db.executeQuery(setTokenQuery);
    res.status(200).send({
      token: token,
      user: {
        NameFirst: user.NameFirst,
        NameLast: user.NameLast,
        Username: user.Username,
        Email: user.Email,
        CreatorPK: user.CreatorPK,
      },
    });
  } catch (myError) {
    console.log("error in setting user token", myError);
    res.status(500).send();
  }
});

app.post("/creators", async (req, res) => {
  // res.send("/creators called");

  // console.log("request body", req.body);

  let nameFirst = req.body.nameFirst;
  let nameLast = req.body.nameLast;
  let username = req.body.username;
  let email = req.body.email;
  let password = req.body.password;

  if (!nameFirst || !nameLast || !email || !password || !username) {
    return res.status(400).send("Bad Request");
  }

  nameFirst = nameFirst.replace("'", "''");
  nameLast = nameLast.replace("'", "''");

  let emailCheckQuery = `SELECT Email
  FROM Creator
  WHERE Email = '${email}'`;

  let existingUser = await db.executeQuery(emailCheckQuery);

  // console.log("existing user", existingUser);

  if (existingUser[0]) {
    return res.status(409).send("duplicate email");
  }

  let hashedPW = bcrypt.hashSync(password);

  let insertQuery = `Insert into Creator(NameFirst,NameLast,Username,Email,Password)
  VALUES('${nameFirst}','${nameLast}','${username}','${email}','${hashedPW}')`;

  db.executeQuery(insertQuery)
    .then(() => {
      res.status(201).send();
    })
    .catch((err) => {
      console.log("error in POST /contact", err);
      res.status(500).send();
    });
});

app.get("/games", (req, res) => {
  //res.send("games api running");

  db.executeQuery(
    `Select *
      FROM game
      LEFT JOIN Genre
      ON genre.GenrePK = game.GenreFK`
  )
    .then((theResults) => {
      res.status(200).send(theResults);
    })
    .catch((myError) => {
      console.log(myError);
      res.status(500).send();
    });
});

app.get("/games/:pk", (req, res) => {
  let pk = req.params.pk;
  // console.log(pk);

  let myQuery = `Select *
  FROM game
  Left join Genre
  On genre.GenrePK = game.GenreFK
  WHERE GamePK = ${pk}`;

  db.executeQuery(myQuery)
    .then((result) => {
      // console.log(result);
      if (result[0]) {
        res.send(result[0]);
      } else {
        res.status(404).send(`Bad request`);
      }
    })
    .catch((err) => {
      console.log("Error in /movie/:pk", err);
      res.status(500).send();
    });
});

// app.get("/movies", (req, res) => {
//   //get data from database
//   db.executeQuery(
//     `Select *
//   FROM Movie
//   Left join Genre
//   On genre.GenrePK = Movie.GenreFK`
//   )
//     .then((theResults) => {
//       res.status(200).send(theResults);
//     })
//     .catch((myError) => {
//       console.log(myError);
//       res.status(500).send();
//     });
// });
