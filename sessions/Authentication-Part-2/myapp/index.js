const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const path = require("path");
const dbPath = path.join(__dirname, "goodreads.db");
const app = express();
app.use(express.json());
let db;

const initializeServerAndDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server starts at http://localhost:3000");
    });
  } catch (e) {
    console.error(`DB ERROR: ${e.message}`);
    process.exit(1);
  }
};

initializeServerAndDB();

// validateUser middleware function
const validateUser = async (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(404);
    response.send("Invalid JWT Token");
  } else {
    await jwt.verify(jwtToken, "rev", async (error, user) => {
      // gives user info
      if (error) {
        response.status(404);
        response.send("Invalid JWT Token");
      } else {
        console.log(user); // This should be users (plural)
        request.username = user.username;
        next();
      }
    });
  }
};

// validateAdmin middleware function
const validateAdmin = async (request, response, next) => {
  let jwtToken1;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken1 = authHeader.split(" ")[1];
  }
  if (jwtToken1 === undefined) {
    response.status(404);
    response.send("Invalid Admin JWT Token");
  } else {
    await jwt.verify(jwtToken1, "rev", async (error, user) => {
      // gives user info
      if (error) {
        response.status(404);
        response.send("Invalid Admin JWT Token");
      } else {
        console.log(admin); // This should be users (plural)
        request.username = admin.username;
        next();
      }
    });
  }
};

// User Registration API
app.post("/users/", async (request, response) => {
  const {
    username,
    password,
    regd_no,
    dept,
    section,
    email,
    semister,
  } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const selectUserQuery = `SELECT * FROM users WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    // Fixed the syntax error by removing the extra comma

    const createUserQuery = `INSERT INTO users(username, password, regd_no, dept, section, email, semister)
    VALUES('${username}','${hashedPassword}','${regd_no}','${dept}',  '${section}',  '${email}', ${semister})`;
    await db.run(createUserQuery).catch((err) => {
      console.error("Error creating user:", err);
      response.status(500).send("Error creating user");
    });
    response.send("User Created Successfully!");
  } else {
    response.status(400);
    response.send("User Already Exist");
  }
});

// User Login API
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM users WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const validPassword = await bcrypt.compare(password, dbUser.password);
    if (validPassword) {
      const payload = { username: username };
      const jwtToken = await jwt.sign(payload, "rev");
      response.send({ jwtToken });
    } else {
      response.status(401).send("Invalid Password");
    }
  }
});

// Admin Registration API
app.post("/admin/", async (request, response) => {
  const { username, password } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `SELECT * FROM admin WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    // Fixed the syntax error by removing the extra comma
    const createUserQuery = `INSERT INTO admin(username, password)
    VALUES('${username}','${hashedPassword}')`;
    await db.run(createUserQuery).catch((err) => {
      console.error("Error creating admin:", err);
      response.status(500).send("Error creating admin");
    });
    response.send("admin Created Successfully!");
  } else {
    response.status(400);
    response.send("admin Already Exist");
  }
});

// add admin API
app.post("/addelectives/", async (request, response) => {
  const {
    course_code,
    elective_name,
    offering,
    department,
    offering_strength,
    not_allowed_students,
  } = request.body;
  const createUserQuery = `INSERT INTO electives(course_code, elective_name, offering, department, offering_strength, not_allowed_students)
    VALUES('${course_code}','${elective_name}','${offering}','${department}',  '${offering_strength}',  '${not_allowed_students}')`;
  await db.run(createUserQuery).catch((err) => {
    console.error("Error creating elective:", err);
    response.status(500).send("Error creating Elective");
  });
  response.send("Elective Created Successfully!");
});

// Admin Login API
app.post("/loginadmin/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM admin WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid admin");
  } else {
    const validPassword = await bcrypt.compare(password, dbUser.password);
    if (validPassword) {
      const payload = { username: username };
      const jwtToken = await jwt.sign(payload, "rev");
      response.send({ jwtToken });
    } else {
      response.status(401).send("Invalid Password");
    }
  }
});

// User Profile API
app.get("/profiles/", validateUser, async (request, response) => {
  const { username } = request;
  const selectUserQuery = `SELECT * FROM users WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  response.send(dbUser);
});
