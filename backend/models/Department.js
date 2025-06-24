import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    // We will link a user as the 'head' of the department later.
    // 'ref' tells Mongoose which model to use during population.
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // This creates a reference to a User document
      required: false, // Not every department might have a head initially
    },
  },
  {
    timestamps: true,
  }
);

const Department = mongoose.model('Department', departmentSchema);

export default Department;