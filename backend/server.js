import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // Import cors
import cookieParser from 'cookie-parser'; // Import cookie-parser
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js'; // Import our new auth routes
import userRoutes from './routes/userRoutes.js'; // Import our new user routes

dotenv.config();
connectDB();

const app = express();

// --- MIDDLEWARE SETUP ---
// Enable CORS - Cross-Origin Resource Sharing
app.use(cors());

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
// --- END API ROUTES ---

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
