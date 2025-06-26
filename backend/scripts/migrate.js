// backend/scripts/migrate.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables from .env file
dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('MONGO_URI not found in environment variables. Make sure your .env file is set up correctly.');
  process.exit(1);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const runMigration = async () => {
  console.log('Starting migration script...');
  await connectDB();

  try {
    console.log('Finding users with legacy `department` field...');
    
    // Find users where `department` exists and `assignedDepartment` does not
    const usersToMigrate = await User.find({
      department: { $exists: true, $ne: null },
      assignedDepartment: { $exists: false }
    });

    if (usersToMigrate.length === 0) {
      console.log('No users found needing migration. Database is up to date.');
      return;
    }

    console.log(`Found ${usersToMigrate.length} user(s) to migrate.`);

    const migrationPromises = usersToMigrate.map(async (user) => {
      // Copy the legacy department ID to the new field
      user.assignedDepartment = user.department;
      
      // Unset the legacy department field
      user.department = undefined;
      
      await user.save({ validateBeforeSave: false }); // Skip validation to avoid issues with other fields
      console.log(`Migrated user: ${user.email} (ID: ${user._id})`);
    });

    await Promise.all(migrationPromises);

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('An error occurred during migration:', error);
  } finally {
    // Disconnect from the database
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

runMigration();
