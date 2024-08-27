const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbpath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();
app.use(express.json());

let db = null;
const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    // console.log(db);
    app.listen(3000, () => {
      console.log("server starts at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBandServer();

const convertPlayerDetailsToCamelCase = (currentObj) => {
  return {
    playerId: currentObj.player_id,
    playerName: currentObj.player_name,
  };
};

const convertMatchDetailsToCamelCase = (currentObj) => {
  return {
    matchId: currentObj.match_id,
    match: currentObj.match,
    year: currentObj.year,
  };
};

// GET all players
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT *
    FROM player_details;`;

  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) => {
      return convertPlayerDetailsToCamelCase(eachPlayer);
    })
  );
});

//GET player
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT * 
    FROM player_details
    WHERE player_id = ${playerId}`;
  const player = await db.get(getPlayerQuery);
  response.send(convertPlayerDetailsToCamelCase(player));
});

//Update Player
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE player_details
    SET player_name = '${playerName}'
    WHERE player_id = ${playerId}`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//get match details API
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
    SELECT *
    FROM match_details
    WHERE match_id = ${matchId};`;
  const getMatchDetails = await db.get(getMatchDetailsQuery);
  response.send(convertMatchDetailsToCamelCase(getMatchDetails));
});

//get matches of player API
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
    SELECT match_details.match_id AS matchId, match AS match, year AS year
    FROM match_details JOIN player_match_score
    ON match_details.match_id = player_match_score.match_id
    WHERE player_match_score.player_id = ${playerId}`;
  const getPlayerMatches = await db.all(getPlayerMatchesQuery);
  response.send(getPlayerMatches);
});

// get list of players of sepecific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersArrayOfMatchQuery = `
    SELECT player_details.player_id AS playerId, player_details.player_name AS playerName
    FROM player_details JOIN player_match_score
        ON player_details.player_id = player_match_score.player_id
    WHERE player_match_score.match_id = ${matchId}`;
  const getPlayersArrayOfMatch = await db.all(getPlayersArrayOfMatchQuery);
  response.send(getPlayersArrayOfMatch);
});

// get statistics of specific player API
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetailsArrayQuery = `
    SELECT player_details.player_id AS playerId,
            player_details.player_name AS playerName,
            sum(player_match_score.score) AS totalScore,
            sum(player_match_score.fours) As totalFours,
            sum(player_match_score.sixes) AS totalSixes        
    FROM player_details JOIN player_match_score
        ON player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId}`;
  const playerDetailsArray = await db.all(playerDetailsArrayQuery);
  response.send(playerDetailsArray[0]);
});

module.exports = app;
