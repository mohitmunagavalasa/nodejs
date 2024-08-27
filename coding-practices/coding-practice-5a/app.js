const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbpath = path.join(__dirname, "moviesData.db");

const app = express();
app.use(express.json());

let db = null;
const initializeDBandSever = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server started at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBandSever();

const convertToMovieObj = (currObj) => {
  return {
    movieId: currObj.movie_id,
    directorId: currObj.director_id,
    movieName: currObj.movie_name,
    leadActor: currObj.lead_actor,
  };
};

const convertToMovieObjForDB = (currObj) => {
  return {
    director_id: currObj.directorId,
    movie_name: currObj.movieName,
    lead_actor: currObj.leadActor,
  };
};

const convertToDirectorObj = (currObj) => {
  return {
    directorId: currObj.director_id,
    directorName: currObj.director_name,
  };
};

const convertToDirectorObjForDB = (currObj) => {
  return {
    director_id: currObj.directorId,
    director_name: currObj.directorName,
  };
};

//Get Movies names
app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
    SELECT *
    FROM movie;`;
  const moviesArray = await db.all(getMoviesQuery);
  response.send(
    moviesArray.map((eachMovie) => {
      const res = convertToMovieObj(eachMovie);
      return { movieName: res.movieName };
    })
  );
});

//Add Movie API -> verify once
app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  //   console.log(directorId);
  //   console.log(movieName);
  //   console.log(leadActor);
  const addMovieQuery = `
      INSERT INTO
          movie(director_id, movie_name, lead_actor)
      VALUES
          (${directorId},'${movieName}', '${leadActor}');`;
  await db.run(addMovieQuery);
  response.send("Movie Successfully Added");
});

//Get Movie API
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
        SELECT *
        FROM movie
        WHERE movie_id = ${movieId}`;
  const movie = await db.get(getMovieQuery);
  response.send(convertToMovieObj(movie));
});

//Update Movie API
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = request.body;
  const updateMovieQuery = `
    UPDATE movie
    SET
        director_id = ${directorId},
        movie_name = '${movieName}',
        lead_actor = '${leadActor}'
    WHERE  movie_id = ${movieId};`;
  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

//Delete Movie API
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
        DELETE FROM movie
        WHERE movie_id = ${movieId};`;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

//GET Directors API -> done
app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `
        SELECT *
        FROM director`;
  const directorsArray = await db.all(getDirectorsQuery);
  response.send(
    directorsArray.map((eachObj) => {
      return convertToDirectorObj(eachObj);
    })
  );
});

//GET Director Movies API
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorMoviesQuery = `
        SELECT movie_name
        FROM movie
        WHERE director_id = ${directorId};`;
  const moviesArray = await db.all(getDirectorMoviesQuery);
  response.send(
    moviesArray.map((eachmovie) => ({ movieName: eachmovie.movie_name }))
  );
});

module.exports = app;
