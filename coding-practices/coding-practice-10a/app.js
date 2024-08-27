const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dbPath = path.join(__dirname, "covid19IndiaPortal.db");

const app = express();
app.use(express.json());

let db;
const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server starts at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
    process.exit(1);
  }
};
initializeDBandServer();

// validateUser
const validateUser = async (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    await jwt.verify(jwtToken, "m", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        next();
      }
    });
  }
};

// get states API
app.get("/states/", validateUser, async (request, response) => {
  const getStatesQuery = `SELECT * FROM state ORDER BY state_id`;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((everyState) => {
      return {
        stateId: everyState.state_id,
        stateName: everyState.state_name,
        population: everyState.population,
      };
    })
  );
});

// get specific State API
app.get("/states/:stateId/", validateUser, async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * FROM state WHERE state_id = ${stateId}`;
  const stateArray = await db.get(getStateQuery);
  response.send({
    stateId: stateArray.state_id,
    stateName: stateArray.state_name,
    population: stateArray.population,
  });
});

// create district API
app.post("/districts/", validateUser, async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistrictQuery = `
        INSERT INTO district(district_name, state_id, cases, cured, active, deaths)
        VALUES ('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}')`;
  await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

// get specific district API
app.get("/districts/:districtId/", validateUser, async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district WHERE district_id = '${districtId}';`;
  const districtArray = await db.get(getDistrictQuery);
  response.send({
    districtId: districtArray.district_id,
    districtName: districtArray.district_name,
    stateId: districtArray.state_id,
    cases: districtArray.cases,
    cured: districtArray.cured,
    active: districtArray.active,
    deaths: districtArray.deaths,
  });
});

// delete specific district API
app.delete(
  "/districts/:districtId/",
  validateUser,
  async (request, response) => {
    const { districtId } = request.params;
    const deleteDistrictQuery = `DELETE FROM district WHERE district_id = '${districtId}';`;
    await db.run(deleteDistrictQuery);
    response.send("District Removed");
  }
);

// update district API
app.put("/districts/:districtId/", validateUser, async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `UPDATE district
                         SET
                            district_name = '${districtName}',
                            state_id = '${stateId}',
                            cases = '${cases}',
                            cured = '${cured}',
                            active = '${active}',
                            deaths = '${deaths}'`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// state statistics API
app.get("/states/:stateId/stats/", validateUser, async (request, response) => {
  const { stateId } = request.params;
  const getStateDistrictQuery = `
            SELECT SUM(district.cases) AS totalCases,
                    SUM(district.cured) AS totalCured,
                    SUM(district.active) AS totalActive,
                    SUM(district.deaths) AS totalDeaths     
            FROM state JOIN district 
            ON state.state_id = district.state_id
            WHERE state.state_id = ${stateId}`;
  const getStats = await db.all(getStateDistrictQuery);
  response.send(getStats[0]);
});

// User Login API
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordSame = await bcrypt.compare(password, dbUser.password);
    if (isPasswordSame) {
      const payload = { username: username };
      const jwtToken = await jwt.sign(payload, "m");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

module.exports = app;
