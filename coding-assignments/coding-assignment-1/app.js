const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const { isMatch, format } = require("date-fns");

const app = express();
app.use(express.json());

const DBPath = path.join(__dirname, "todoApplication.db");

let db;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: DBPath,
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
initializeDBAndServer();

const hasPriorityProperty = (requestBody) => {
  return requestBody.priority !== undefined;
};

const hasStatusProperty = (requestBody) => {
  return requestBody.status !== undefined;
};

const hasCategoryProperty = (requestBody) => {
  return requestBody.category !== undefined;
};

const hasPriorityAndStatusProperties = (requestBody) => {
  return requestBody.priority !== undefined && requestBody.status !== undefined;
};

const hasStatusAndCategoryProperties = (requestBody) => {
  return requestBody.status !== undefined && requestBody.category !== undefined;
};

const hasPriorityAndCategoryProperties = (requestBody) => {
  return (
    requestBody.priority !== undefined && requestBody.category !== undefined
  );
};

const validPriority = (requestBody) => {
  return (
    requestBody.priority === "HIGH" ||
    requestBody.priority === "LOW" ||
    requestBody.priority === "MEDIUM"
  );
};

const validStatus = (requestBody) => {
  return (
    requestBody.status === "TO DO" ||
    requestBody.status === "IN PROGRESS" ||
    requestBody.status === "DONE"
  );
};

const validCategory = (requestBody) => {
  return (
    requestBody.category === "WORK" ||
    requestBody.category === "HOME" ||
    requestBody.category === "LEARNING"
  );
};

const outPutResult = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

//API 1 -> get all todos
app.get("/todos/", async (request, response) => {
  let getTodoQuery = "";
  const { status, priority, category, search_q = "" } = request.query;
  //   console.log(hasPriorityProperty(request.query));
  //   console.log(hasStatusProperty(request.query));
  //   console.log(hasCategoryProperty(request.query));
  //   console.log(hasStatusAndCategoryProperties(request.query));
  //   console.log(hasPriorityAndStatusProperties(request.query));
  //   console.log(hasPriorityAndCategoryProperties(request.query));
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (validPriority(request.query) && validStatus(request.query)) {
        getTodoQuery = `SELECT * FROM todo WHERE priority = '${priority}' AND status = '${status}' `;
        const date = await db.all(getTodoQuery);
        response.send(
          date.map((eachTodoObject) => {
            return outPutResult(eachTodoObject);
          })
        );
      } else {
        if (validPriority(request.query) === false) {
          response.status(400);
          response.send("Invalid Todo Priority");
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      }
      break;

    case hasStatusAndCategoryProperties(request.query):
      if (validStatus(request.query) && validCategory(request.query)) {
        getTodoQuery = `SELECT * FROM todo WHERE status = '${status}' AND category = '${category}'`;
        const date = await db.all(getTodoQuery);
        response.send(
          date.map((eachTodoObject) => {
            return outPutResult(eachTodoObject);
          })
        );
      } else {
        if (validStatus(request.query) === false) {
          response.status(400);
          response.send("Invalid Todo Status");
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      }
      break;
    case hasPriorityAndCategoryProperties(request.query):
      if (validPriority(request.query) && validCategory(request.query)) {
        getTodoQuery = `SELECT * FROM todo WHERE priority = '${priority}' AND category = '${category}'`;
        const date = await db.all(getTodoQuery);
        response.send(
          date.map((eachTodoObject) => {
            return outPutResult(eachTodoObject);
          })
        );
      } else {
        if (validPriority(request.query) === false) {
          response.status(400);
          response.send("Invalid Todo Priority");
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      }
      break;
    case hasPriorityProperty(request.query):
      if (validPriority(request.query)) {
        getTodoQuery = `SELECT * FROM todo WHERE priority = '${priority}'`;
        const date = await db.all(getTodoQuery);
        response.send(
          date.map((eachTodoObject) => {
            return outPutResult(eachTodoObject);
          })
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasStatusProperty(request.query):
      if (validStatus(request.query)) {
        getTodoQuery = `SELECT * FROM todo WHERE status = '${status}'`;
        const date = await db.all(getTodoQuery);
        response.send(
          date.map((eachTodoObject) => {
            return outPutResult(eachTodoObject);
          })
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasCategoryProperty(request.query):
      if (validCategory(request.query)) {
        getTodoQuery = `SELECT * FROM todo WHERE category = '${category}'`;
        const date = await db.all(getTodoQuery);
        response.send(
          date.map((eachTodoObject) => {
            return outPutResult(eachTodoObject);
          })
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'`;
      const date = await db.all(getTodoQuery);
      response.send(
        date.map((eachTodoObject) => {
          return outPutResult(eachTodoObject);
        })
      );
      break;
  }
});

//API 2 -> get specific todo
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getSpecificTodoQuery = `SELECT * FROM todo WHERE id = ${todoId}`;
  const data = await db.get(getSpecificTodoQuery);
  response.send(outPutResult(data));
});

//API 3 -> get all todos with specific due date
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  //console.log(isMatch(date, "yyyy-MM-dd"));
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    //console.log(newDate);
    const getTodoQuery = `SELECT * FROM todo WHERE due_date = '${newDate}';`;
    const data = await db.all(getTodoQuery);
    response.send(data.map((eachTodo) => outPutResult(eachTodo)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4 -> create Todo
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (validStatus(request.body)) {
    if (validCategory(request.body)) {
      if (validPriority(request.body)) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDate = format(new Date(dueDate), "yyyy-MM-dd");
          const createTodoQuery = `
                    INSERT INTO todo(id, todo, priority, category, status, due_date)
                    VALUES (${id}, '${todo}', '${priority}', '${category}', '${status}', '${newDate}')`;
          await db.run(createTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Status");
  }
});

//API 5-> update Todo
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updatedItemMessage = "";
  let updateQuery = "";

  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId}`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    id = previousTodo.id,
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = requestBody;

  switch (true) {
    case requestBody.status !== undefined:
      if (validStatus(requestBody)) {
        updateQuery = `UPDATE todo SET status = '${status}'`;
        updatedItemMessage = "Status Updated";
        await db.run(updateQuery);
        response.send(updatedItemMessage);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case requestBody.priority !== undefined:
      if (validPriority(requestBody)) {
        updateQuery = `UPDATE todo SET priority = '${priority}'`;
        updatedItemMessage = "Priority Updated";
        await db.run(updateQuery);
        response.send(updatedItemMessage);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case requestBody.todo !== undefined:
      updateQuery = `UPDATE todo SET todo = '${todo}'`;
      updatedItemMessage = "Todo Updated";
      await db.run(updateQuery);
      response.send(updatedItemMessage);
      break;
    case requestBody.category !== undefined:
      if (validCategory(requestBody)) {
        updateQuery = `UPDATE todo SET category = '${category}'`;
        updatedItemMessage = "Category Updated";
        await db.run(updateQuery);
        response.send(updatedItemMessage);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case requestBody.dueDate !== undefined:
      if (isMatch(requestBody.dueDate, "yyyy-MM-dd")) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateQuery = `UPDATE todo SET due_date = '${newDate}'`;
        updatedItemMessage = "Due Date Updated";
        await db.run(updateQuery);
        response.send(updatedItemMessage);
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

//API 6 -> delete Todo
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId}`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
