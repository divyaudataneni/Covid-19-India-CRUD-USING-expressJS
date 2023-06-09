const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

module.exports = app;

const convertdbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDBtoResponseObject = (dbObject) => {
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

//GET API 1
app.get("/states/", async (request, response) => {
  const stateQuery = `
    SELECT *
    FROM state;
    `;

  const stateArray = await db.all(stateQuery);
  response.send(
    stateArray.map((eachstate) => convertdbObjectToResponseObject(eachstate))
  );
});

//GET STATEID API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `
    SELECT *
    FROM state
    WHERE state_id ='${stateId}';
    `;

  const state = await db.get(stateQuery);
  response.send(convertdbObjectToResponseObject(state));
});

//get districts API 3
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
  const addDistrictQuery = `
    INSERT INTO 
    district (district_name,state_id,cases,cured,active,deaths)
     VALUES (
         '${districtName}',
         ${stateId},
         ${cases},
         ${cured},
         ${active},
         ${deaths});
     `;
  const dbResponse = await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//GET DISTRICT ID API4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const query = `
    SELECT * 
    FROM district
    WHERE district_id = ${districtId};
    `;
  const district = await db.get(query);
  response.send(convertDistrictDBtoResponseObject(district));
});

//DELETE DISTRICT API 5//
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
    DELETE FROM district
    WHERE district_id = ${districtId};`;
  await db.run(deleteQuery);
  response.send("District Removed");
});

//UPDATE(PUT) DISTRICT API6//
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;

  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateQuery = `
    UPDATE district
    SET district_name = '${districtName}',
         state_id = ${stateId},
         cases = ${cases},
         cured = ${cured},
         active = ${active},
         deaths = ${deaths} 
    WHERE district_id = ${districtId};`;
  const updatedDistrict = await db.run(updateQuery);
  response.send("District Details Updated");
});

//GET STATE-ID  API7//
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
  SELECT 
     SUM(cases),
     SUM(cured),
     SUM(active),
     SUM(deaths)
  FROM district
  WHERE state_id = ${stateId};
  `;
  const stats = await db.get(getStateQuery);
  console.log(stats);

  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//GET DISTRICT WIHT DISTRICT ID API8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
select state_id from district
where district_id = ${districtId};
`;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);

  const getStateNameQuery = `
select state_name as stateName from state
where state_id = ${getDistrictIdQueryResponse.state_id};
`;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});
