import express from 'express'; 
import { authenticateToken } from '../middleware/auth.middleware.js';
import { createBooking } from '../controllers/bookings.controller.js';

const bookingRouter = express.Router();
bookingRouter.post('/', authenticateToken, createBooking);

export default bookingRouter;