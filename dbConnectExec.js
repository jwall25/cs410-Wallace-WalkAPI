const sql = require("mssql");
const walkConfig = require("./config.js");

const sqlConfig = {
  user: walkConfig.DB.user,
  password: walkConfig.DB.password,
  database: walkConfig.DB.database,
  server: walkConfig.DB.server,
};

async function executeQuery(aQuery) {
  let connection = await sql.connect(sqlConfig);
  let result = await connection.query(aQuery);

  //   console.log(result);

  return result.recordset;
}

// executeQuery(`Select *
// FROM Movie
// Left join Genre
// On genre.GenrePK = Movie.GenreFK`);

module.exports = { executeQuery: executeQuery };
