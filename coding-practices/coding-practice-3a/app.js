const addDays = require("date-fns/addDays");
const express = require("express");
const app = express();
app.listen(3000);
app.get("/", (request, response) => {
  const newDate = addDays(new Date(), 100);
  const res = `${newDate.getDate()}/${
    newDate.getMonth() + 1
  }/${newDate.getFullYear()}`;
  response.send(res);
});
module.exports = app;
