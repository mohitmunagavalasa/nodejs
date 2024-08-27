const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "goodreads.db");
let db;
const initializeDBansServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server starts at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};
initializeDBansServer();

const validateUser = async (request, response, next) => {
  const authHeader = request.headers["authorization"];
  let jwtToken;
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid User");
  } else {
    await jwt.verify(jwtToken, "m", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid User");
      } else {
        request.username = payload.username;
        next();
      }
    });
  }
};

// get user profile API
app.get("/profiles/", validateUser, async (request, response) => {
  const { username } = request;
  const getUserProfileQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUserProfile = await db.get(getUserProfileQuery);
  response.send(dbUserProfile);
});

// user registration API
app.post("/users/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    const createUserQuery = `
                    INSERT INTO user(username, name, password, gender, location)
                    VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}')
        `;
    await db.run(createUserQuery);
    response.send("user created successfully");
  } else {
    response.send("user already exist");
    response.status(400);
  }
});

// user login api
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordSame = await bcrypt.compare(password, dbUser.password);
    if (isPasswordSame) {
      const payload = { username: username };
      const jwtToken = await jwt.sign(payload, "m");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});
