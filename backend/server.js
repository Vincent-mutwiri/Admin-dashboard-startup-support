import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // Import cors
import cookieParser from 'cookie-parser'; // Import cookie-parser
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js'; // Import our auth routes
import userRoutes from './routes/userRoutes.js'; // Import our user routes
import startupRoutes from './routes/startupRoutes.js'; // Import our startup routes
import departmentRoutes from './routes/departmentRoutes.js'; // Import our department routes
import { notFound, errorHandler } from './middleware/errorMiddleware.js'; // Import error handlers

dotenv.config();
connectDB();

const app = express();

// --- MIDDLEWARE SETUP ---
// Enable CORS - Cross-Origin Resource Sharing
app.use(cors({ origin: 'http://localhost:5174', credentials: true }));

// Body parser middleware to parse JSON data
app.use(express.json());
// Body parser middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

// Cookie parser middleware to parse cookies from the request
app.use(cookieParser());
// --- END MIDDLEWARE SETUP ---

// --- API ROUTES ---
app.use('/api/auth', authRoutes); // Use the auth routes for any URL starting with /api/auth
app.use('/api/users', userRoutes); // Use the user routes for any URL starting with /api/users
app.use('/api/startups', startupRoutes); // Use the startup routes for any URL starting with /api/startups
app.use('/api/departments', departmentRoutes); // Use the department routes for any URL starting with /api/departments
// --- END API ROUTES ---

app.get('/', (req, res) => {
  res.send('API is running...');
});

// --- ERROR HANDLING MIDDLEWARE ---
app.use(notFound);
app.use(errorHandler);
// --- END ERROR HANDLING MIDDLEWARE ---

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
