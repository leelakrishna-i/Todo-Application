//importing all needed packages
const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const createDbAndStartServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`SERVER IS RUNNING AT http://localhost:3000/`);
    });
  } catch (error) {
    console.log(`DB ERROR MESSAGE ${error.message}`);
    process.exit(1);
  }
};

createDbAndStartServer();

//get data on query peraMeters
app.get("/todos/", async (request, response) => {
  let getDataQuery = "";
  const { search_q = "", priority, status } = request.query;
  if (priority !== undefined && status !== undefined) {
    getDataQuery = `
            SELECT * FROM todo WHERE priority ='${priority}' AND status='${status}' AND todo LIKE '%${search_q}%';
        `;
  } else if (status !== undefined) {
    getDataQuery = `
            SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status ='${status}';`;
  } else if (priority !== undefined) {
    getDataQuery = `
            SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority ='${priority}';
        `;
  } else if (search_q !== undefined) {
    getDataQuery = `
            SELECT * FROM todo WHERE todo LIKE '%${search_q}%';
        `;
  }
  let data = await db.all(getDataQuery);
  response.send(data);
});

//get data using todoID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getUniqueDataQuery = `
        SELECT * FROM todo WHERE id=${todoId};
    `;
  const todoData = await db.get(getUniqueDataQuery);
  response.send(todoData);
});

//post data in to TODO
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const createDataQuery = `
        INSERT INTO todo (id,todo,priority,status)
        VALUES(${id},'${todo}','${priority}','${status}');
    `;
  await db.run(createDataQuery);
  response.send("Todo Successfully Added");
});

//update data on todoID
app.put("/todos/:todoId/", async (request, response) => {
  let update = "";
  const { todoId } = request.params;
  const requestBody = request.body;
  if (requestBody.todo !== undefined) {
    update = "Todo";
  } else if (requestBody.priority !== undefined) {
    update = "Priority";
  } else if (requestBody.status !== undefined) {
    update = "Status";
  }

  const getUniqueDataQuery = `
            SELECT * FROM todo WHERE id=${todoId};
    `;
  const uniqueData = await db.get(getUniqueDataQuery);
  const {
    todo = uniqueData.todo,
    priority = uniqueData.priority,
    status = uniqueData.status,
  } = request.body;

  const updateUniqueDataQuery = `UPDATE todo SET todo ='${todo}',priority ='${priority}',status='${status}' WHERE id=${todoId};`;
  await db.run(updateUniqueDataQuery);
  response.send(`${update} Updated`);
});

//delete todo using ID

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id=${todoId}`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
