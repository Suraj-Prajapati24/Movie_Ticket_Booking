import express from 'express'; 
import { getAllMovies, createMovie} from "../controllers/movie.controller.js";

const moviesRouter = express.Router();

moviesRouter.get("/", getAllMovies);
moviesRouter.post("/", createMovie);

export default moviesRouter;