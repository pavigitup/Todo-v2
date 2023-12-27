const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");
const format = require("date-fns/format");
const dbPath = path.join(__dirname, "todoApplication.db");
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
    console.log(`DB Error: ${e.message}`);
  }
};
initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const outPutResult = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
                  SELECT *
                  FROM todo WHERE status = '${status}' and priority = '${priority}'`;
          data = await db.all(getTodosQuery);
          response.send(data.map((e) => outPutResult(e)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasCategoryAndStatus(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
                  SELECT *
                  FROM todo WHERE category = '${category}' and status = '${status}'`;
          data = await db.all(getTodosQuery);
          response.send(data.map((e) => outPutResult(e)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategoryAndPriority(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "LOW" ||
          priority === "MEDIUM"
        ) {
          getTodosQuery = `
                  SELECT *
                  FROM todo WHERE category = '${category}' and priority = '${priority}'`;
          data = await db.all(getTodosQuery);
          response.send(data.map((e) => outPutResult(e)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        getTodosQuery = `
                  SELECT *
                  FROM todo WHERE priority = '${priority}'`;
        data = await db.all(getTodosQuery);
        response.send(data.map((e) => outPutResult(e)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `
                  SELECT *
                  FROM todo WHERE status = '${status}'`;
        data = await db.all(getTodosQuery);
        response.send(data.map((e) => outPutResult(e)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasSearchProperty(request.query):
      getTodosQuery = `
                  SELECT *
                  FROM todo WHERE todo LIKE '%${search_q}%'`;
      data = await db.all(getTodosQuery);
      response.send(data.map((e) => outPutResult(e)));
      break;

    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `SELECT * FROM todo WHERE category = '${category}';
                     `;
        data = await db.all(getTodosQuery);
        response.send(data.map((e) => outPutResult(e)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    default:
      getTodosQuery = `select * from todo;`;
      data = await db.all(getTodosQuery);
      response.send(data.map((e) => outPutResult(e)));
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodosQuery = `
  SELECT *
  FROM todo
  WHERE id = ${todoId};`;
  data = await db.get(getTodosQuery);
  response.send(outPutResult(data));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  console.log(isMatch(date, "yyyy-MM-dd"));
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    console.log(newDate);
    const getTodosQuery = `
  SELECT *
  FROM todo
  WHERE due_date = '${newDate}';`;
    data = await db.all(getTodosQuery);
    response.send(data.map((e) => outPutResult(e)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const createTodo = `
                    INSERT INTO todo(id,todo,priority,status,category,due_date)
                    VALUES (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
          await db.run(createTodo);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  const getTodo = `
    SELECT *
    FROM todo
    WHERE id = ${todoId};`;
  const previousData = await db.get(getTodo);
  console.log(previousData);

  const {
    todo = previousData.todo,
    priority = previousData.priority,
    status = previousData.status,
    category = previousData.category,
    dueDate = previousData.dueDate,
  } = request.body;

  let updateData;
  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateData = `UPDATE todo 
              SET  todo = '${todo}' , priority = '${priority}', status = '${status}', category = '${category}',due_date = '${dueDate}'
               WHERE id = ${todoId};`;
        await db.run(updateData);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        updateData = `UPDATE todo 
              SET  todo = '${todo}' , priority = '${priority}', status = '${status}', category = '${category}',due_date = '${dueDate}'
               WHERE id = ${todoId};`;
        await db.run(updateData);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case requestBody.todo !== undefined:
      updateData = `UPDATE todo 
              SET  todo = '${todo}' , priority = '${priority}', status = '${status}', category = '${category}',due_date = '${dueDate}'
               WHERE id = ${todoId};`;
      await db.run(updateData);
      response.send("Todo Updated");
      break;
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateData = `UPDATE todo 
              SET  todo = '${todo}' , priority = '${priority}', status = '${status}', category = '${category}',due_date = '${dueDate}'
               WHERE id = ${todoId};`;
        await db.run(updateData);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        updateData = `UPDATE todo 
              SET  todo = '${todo}' , priority = '${priority}', status = '${status}', category = '${category}',due_date = '${dueDate}'
               WHERE id = ${todoId};`;
        await db.run(updateData);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodo = `
    DELETE FROM todo
    WHERE id = ${todoId};`;
  await db.run(deleteTodo);
  response.send("Todo Deleted");
});
module.exports = app;
