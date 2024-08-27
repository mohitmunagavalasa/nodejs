const express = require("express");
const app = express();
app.listen(3000);
app.get("/", (request, response) => {
  response.send("Express JS");
});
module.exports = app;
