import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Department from '../models/Department.js';

// Load environment variables
dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    // Create a default department if it doesn't exist
    let department = await Department.findOne({ name: 'Administration' });
    if (!department) {
      department = await Department.create({
        name: 'Administration',
        description: 'Default administration department',
      });
      console.log('Created default department:', department.name);
    }

    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    if (adminExists) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create admin user
    const admin = await User.create({
      fullName: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      assignedDepartment: department._id,
      isActive: true,
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();
