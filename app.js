const express = require("express");
const app = express();

const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
app.use(express.json());
let db = null;

const initializerDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3007, () => {
      console.log("sever is running at 3007");
    });
  } catch (e) {
    console.log(`error is :${e.message}`);
  }
};
initializerDbServer();

const convertDbObjectToResponse = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

app.get("/states/", async (request, response) => {
  const getPlayerQuery = `
    select * from state;`;
  const result = await db.all(getPlayerQuery);
  response.send(
    result.map((eachState) => convertDbObjectToResponse(eachState))
  );
});

app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `select * from state where state_id='${stateId}';`;
  const state = await db.get(getStateQuery);
  response.send(convertDbObjectToResponse(state));
});

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const InsertQuery = `INSERT INTO 
    district (district_name,state_id,cases,cured,active,deaths)VALUES
    ('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}');`;
  await db.run(InsertQuery);
  response.send("District Successfully Added");
});

const convertDistrictDbObjectToResponse = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrict = `select * from district where district_id='${districtId}';`;
  const district = await db.get(getDistrict);
  response.send(convertDistrictDbObjectToResponse(district));
});

app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const removeDistrict = `DELETE FROM district WHERE district_id=${districtId};`;
  await db.run(removeDistrict);
  response.send("District Removed");
});

app.put("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const districtsValues = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtsValues;
  const updateDistrict = `UPDATE district set district_name='${districtName}',
    state_id='${stateId}',
    cases='${cases}',
    cured='${cured}',
    active='${active}',
    deaths='${deaths}';`;
  await db.run(updateDistrict);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getDetailsOfCases = `select SUM(cases) as totalCases,
  SUM(cured) as totalCured,
  SUM(active) as totalActive, 
  SUM(deaths) as totalDeaths from district 
  WHERE state_id=?;`;
  const details = await db.get(getDetailsOfCases, [stateId]);
  response.send(details);
});

const convertDbStateToResponse = (dbState) => {
  return {
    stateName: dbState.state_name,
  };
};
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getState = `select state_name from state inner join district on state.state_id=district.state_id
    where district_id='${districtId}';`;
  const stateName = await db.get(getState);
  response.send(convertDbStateToResponse(stateName));
});

module.exports = app;
