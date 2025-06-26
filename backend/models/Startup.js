import mongoose from 'mongoose';

const startupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Startup name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    cohort: {
      type: String,
      required: [true, 'Cohort is required'],
      trim: true,
      enum: {
        values: ['I', 'II', 'III'],
        message: 'Cohort must be one of: I, II, III'
      }
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Create the model from the schema
const Startup = mongoose.model('Startup', startupSchema);

export default Startup;