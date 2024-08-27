const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "goodreads.db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json()); // built in middleware function

let db;
const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server Starts at http://localhost:3000`);
    });
  } catch {}
};
initializeDBandServer();

//Get Books API
app.get("/books/", async (request, response) => {
  const getBooksQuery = `SELECT * FROM book ORDER BY book_id`;
  const bookArray = await db.all(getBooksQuery);
  response.send(bookArray);
});

// User Registration API
app.post("/users/", async (request, response) => {
  const { name, username, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    const createUserQuery = `
                        INSERT INTO user(name, username, password, gender, location)
                        VALUES('${name}','${username}','${hashedPassword}','${gender}','${location}');`;
    await db.run(createUserQuery);
    response.send("User Created Successfully");
  } else {
    response.status(400);
    response.send("User Already Exist");
  }
});

// User Login API
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const payload = { username: username };
    const jwtToken = await jwt.sign(payload, "M");
    response.send(jwtToken);
  }
});
