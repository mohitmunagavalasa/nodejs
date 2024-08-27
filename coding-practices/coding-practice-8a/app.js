const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is starting in http://localhost:3000");
    });
  } catch (e) {
    process.exit(1);
    console.log(`DB Error : ${e.message}`);
  }
};

initializeDBandServer();

const hasPriorityAndStatusProperties = (requestObj) => {
  return requestObj.priority !== undefined && requestObj.status !== undefined;
};

const hasPriorityProperty = (requestObj) => {
  return requestObj.priority !== undefined;
};

const hasStatusProperty = (requestObj) => {
  return requestObj.status !== undefined;
};

//get all todo
app.get("/todos/", async (request, response) => {
  let getTodoQuery = "";
  const { search_q = "", status, priority } = request.query;
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `
                SELECT *
                FROM todo
                WHERE todo LIKE '%${search_q}%'
                AND status = '${status}'
                AND priority = '${priority}'`;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `
                SELECT *
                FROM todo
                WHERE todo LIKE '%${search_q}%'
                AND priority = '${priority}'`;
      break;
    case hasStatusProperty(request.query):
      getTodoQuery = `
                SELECT *
                FROM todo
                WHERE todo LIKE '%${search_q}%'
                AND status = '${status}'`;
      break;
    default:
      getTodoQuery = `
                SELECT *
                FROM todo
                WHERE todo LIKE '%${search_q}%';
            `;
  }
  const data = await db.all(getTodoQuery);
  response.send(data);
});

//get specific todo
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getSpecificTodoQuery = `
        SELECT *
        FROM todo
        WHERE id = ${todoId}`;
  const data = await db.get(getSpecificTodoQuery);
  response.send(data);
});

//post todo
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const updateQuery = `
        INSERT INTO todo(id, todo, priority, status)
        VALUES (${id}, '${todo}', '${priority}', '${status}');`;
  await db.run(updateQuery);
  response.send("Todo Successfully Added");
});

//put todo api
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updateColumn = "";
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }

  const previousTodoQuery = `
        SELECT *
        FROM todo
        WHERE id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  // if notdefine then set value as previous todo
  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
  } = request.body;

  const updateQuery = `
        UPDATE todo
        SET todo = '${todo}',
            status = '${status}',
            priority = '${priority}'
        WHERE id = ${todoId};`;
  await db.run(updateQuery);
  response.send(`${updateColumn} Updated`);
});

// delete todo api
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
        DELETE FROM todo
        WHERE id = ${todoId}`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
