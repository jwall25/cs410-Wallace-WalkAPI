const express = require("express");

const db = require("./dbConnectExec.js");

const app = express();

app.listen(5000, () => {
  console.log("App is running on Port 5000");
});

app.get("/hi", (req, res) => {
  res.send("hello world");
});

app.get("/", (req, res) => {
  res.send("API is running");
});

// app.post();
// app.put();

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

// app.get("/movies/:pk", (req, res) => {
//   let pk = req.params.pk;
//   // console.log(pk);

//   let myQuery = `Select *
//   FROM Movie
//   Left join Genre
//   On genre.GenrePK = Movie.GenreFK
//   WHERE MoviePK = ${pk}`;

//   db.executeQuery(myQuery)
//     .then((result) => {
//       // console.log(result);
//       if (result[0]) {
//         res.send(result[0]);
//       } else {
//         res.status(404).send(`Bad request`);
//       }
//     })
//     .catch((err) => {
//       console.log("Error in /movie/:pk", err);
//       res.status(500).send();
//     });
// });
