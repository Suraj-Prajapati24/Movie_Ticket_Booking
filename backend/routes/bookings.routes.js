import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { createBooking, getMyBookings } from '../controllers/bookings.controller.js';

const bookingRouter = express.Router();
bookingRouter.post('/', authenticateToken, createBooking);
bookingRouter.get('/me', authenticateToken, getMyBookings);

export default bookingRouter;