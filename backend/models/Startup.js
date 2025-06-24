import mongoose from 'mongoose';

const startupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true, // This field must be provided
      unique: true,   // No two startups can have the same name
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    // Automatically add 'createdAt' and 'updatedAt' fields
    timestamps: true,
  }
);

// Create the model from the schema
const Startup = mongoose.model('Startup', startupSchema);

export default Startup;