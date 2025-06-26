import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const resetAdminPassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    // Generate a new salt and hash the password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    console.log('Generated hash:', hashedPassword);

    // Update the admin user with the new hashed password
    const result = await User.updateOne(
      { email: 'admin@example.com' },
      { $set: { password: hashedPassword } }
    );

    if (result.matchedCount === 0) {
      console.log('Admin user not found');
      process.exit(1);
    }

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
