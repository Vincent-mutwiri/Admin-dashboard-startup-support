import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const resetAdminPassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    // Find admin user
    const admin = await User.findOne({ email: 'admin@example.com' });
    if (!admin) {
      console.log('Admin user not found');
      process.exit(1);
    }

    // Set password to 'admin123' (pre-hashed with bcrypt)
    const hashedPassword = '$2a$12$LQv3c1yqBKYH0Zfkr2kf8.LBpUAwL4mR3zgV7pB5UQOoWlWYJZ5Xa';
    
    // Update password directly in the database
    admin.password = hashedPassword;
    await admin.save();

    console.log('✅ Admin password updated successfully!');
    console.log('Email: admin@example.com');
    console.log('New Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating admin password:', error);
    process.exit(1);
  }
};

resetAdminPassword();
