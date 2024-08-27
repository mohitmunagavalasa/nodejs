const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const databasepath = path.join(__dirname, "cricketTeam.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: databasepath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/ ");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBandServer();

const convertToResponseObj = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    jerseyNumber: dbObject.jersey_number,
    role: dbObject.role,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
  SELECT * 
  FROM cricket_team;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) => convertToResponseObj(eachPlayer))
  );
});

app.post("/players/", async (request, response) => {
  const { playerName, jerseyNumber, role } = request.body;
  const addPlayerQuery = `
  INSERT INTO 
    cricket_team (player_name, jersey_number, role)
  values ('${playerName}', ${jerseyNumber}, '${role}');`;
  await db.run(addPlayerQuery);
  response.send("Player Added to Team");
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM cricket_team WHERE player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(convertToResponseObj(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetail = request.body;
  const { playerName, jerseyNumber, role } = playerDetail;
  const getPlayerQuery = `UPDATE cricket_team 
     SET 
        player_name = '${playerName}',
        jersey_number = ${jerseyNumber},
        role = '${role}'
     WHERE player_id = ${playerId};`;
  await db.run(getPlayerQuery);
  response.send("Player Details Updated");
});

app.delete("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const deletePlayerQuery = `DELETE FROM
      cricket_team
      WHERE
      player_id = ${playerId};`;
  await db.run(deletePlayerQuery);
  response.send("Player Removed");
});

module.exports = app;
