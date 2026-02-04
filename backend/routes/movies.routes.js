import express from 'express'; 
import { getAllMovies } from '../controllers/movies.controller.js';

const moviesRouter = express.Router();

moviesRouter.get("/", getAllMovies);

export default moviesRouter;