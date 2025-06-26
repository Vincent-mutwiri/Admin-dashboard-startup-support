import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const verifyAdminPassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    // Find admin user with password
    const admin = await User.findOne({ email: 'admin@example.com' }).select('+password');
    if (!admin) {
      console.log('Admin user not found');
      process.exit(1);
    }

    console.log('Admin user found:');
    console.log('Email:', admin.email);
    console.log('Password hash:', admin.password);
    console.log('Password hash length:', admin.password ? admin.password.length : 0);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

verifyAdminPassword();
