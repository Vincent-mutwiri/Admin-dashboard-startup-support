import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // Import cors
import cookieParser from 'cookie-parser'; // Import cookie-parser
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js'; // Import our auth routes
import userRoutes from './routes/userRoutes.js'; // Import our user routes
import startupRoutes from './routes/startupRoutes.js'; // Import our startup routes
import departmentRoutes from './routes/departmentRoutes.js'; // Import our department routes
import resourceRoutes from './routes/resourceRoutes.js'; // Import our resource routes
import milestoneRoutes from './routes/milestoneRoutes.js'; // Import our milestone routes
import meetingRoutes from './routes/meetingRoutes.js'; // Import our meeting routes
import { notFound, errorHandler } from './middleware/errorMiddleware.js'; // Import error handlers

dotenv.config();
connectDB();

const app = express();

// --- MIDDLEWARE SETUP ---
// CORS configuration
const allowedOrigins = [
  'http://localhost:5174',  // Vite dev server
  'http://localhost:3000',  // Common React dev server port
  'https://your-production-domain.com'  // Add your production domain here
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list
    if (allowedOrigins.indexOf(origin) !== -1 || 
        // Allow all localhost origins in development
        (process.env.NODE_ENV === 'development' && /^https?:\/\/localhost(:[0-9]+)?$/.test(origin))) {
      return callback(null, true);
    }
    
    // If not allowed, return error
    return callback(new Error(`The CORS policy for this site does not allow access from the specified Origin: ${origin}`), false);
  },
  credentials: true,  // Required for cookies/sessions
  exposedHeaders: ['set-cookie', 'authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

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

// Mount department routes
app.use('/api/departments', departmentRoutes); // Use the department routes for any URL starting with /api/departments

// Mount resource routes under department routes
app.use('/api/departments/:departmentId/resources', (req, res, next) => {
  // Add departmentId to the request object for the resource routes
  req.departmentId = req.params.departmentId;
  next();
}, resourceRoutes);

// Mount root resource routes (for resources not associated with a specific department)
app.use('/api/resources', resourceRoutes);

// Mount milestone routes
app.use('/api/milestones', milestoneRoutes);

// Mount meeting routes
app.use('/api/meetings', meetingRoutes);
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
