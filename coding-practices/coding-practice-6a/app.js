const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbpath = path.join(__dirname, "covid19India.db");
const app = express();
app.use(express.json());
let db = null;
const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server started at http://localhost");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBandServer();

const convertStateToCamelCase = (eachobj) => {
  return {
    stateId: eachobj.state_id,
    stateName: eachobj.state_name,
    population: eachobj.population,
  };
};

const convertDistrictToCamelCase = (eachobj) => {
  return {
    districtId: eachobj.district_id,
    districtName: eachobj.district_name,
    stateId: eachobj.state_id,
    cases: eachobj.cases,
    cured: eachobj.cured,
    active: eachobj.active,
    deaths: eachobj.deaths,
  };
};

//GET states API -> done
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT *
    FROM state
    ORDER BY state_id`;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) => {
      return convertStateToCamelCase(eachState);
    })
  );
});

//Get State API -> done
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT *
    FROM state
    WHERE state_id = ${stateId}`;
  const state = await db.get(getStateQuery);
  response.send(convertStateToCamelCase(state));
});

//Add district
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addDistrictQuery = `
    INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
    VALUES ('${districtName}', ${stateId}, ${cases}, ${cured},${active}, ${deaths});`;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//GET district ->done
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT *
    FROM district
    WHERE district_id = ${districtId}`;
  const districtArray = await db.get(getDistrictQuery);
  response.send(convertDistrictToCamelCase(districtArray));
});

//Delete district API -> done
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM district
    WHERE district_id = ${districtId};`;
  await db.all(deleteDistrictQuery);
  response.send("District Removed");
});

//update district API
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
    UPDATE district
    SET 
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE district_id = ${districtId} ; `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//Get statistics
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT *
    FROM district
    WHERE state_id = ${stateId}`;
  const statesArray = await db.all(getStateQuery);
  const resObj = {
    totalCases: 0,
    totalCured: 0,
    totalActive: 0,
    totalDeaths: 0,
  };
  statesArray.forEach((element) => {
    resObj.totalCases += element.cases;
    resObj.totalCured += element.cured;
    resObj.totalActive += element.active;
    resObj.totalDeaths += element.deaths;
  });
  response.send(resObj);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT DISTINCT state.state_name
    FROM state JOIN district
    ON state.state_id = district.state_id
    WHERE district_id = ${districtId}`;
  const stateName = await db.get(getStateNameQuery);
  response.send({ stateName: stateName.state_name });
});

module.exports = app;
