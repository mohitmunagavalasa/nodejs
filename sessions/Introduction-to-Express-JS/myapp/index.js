const express = require("express");
const app = express();
app.get("/", (request, response) => {
  response.send("Hello World!");
  console.log(request);
});
app.get("/date", (request, response) => {
  const date = new Date();
  response.send(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
});
app.get("/page", (request, response) => {
  response.sendFile("./page.html", { root: __dirname });
});
app.listen(3000);
