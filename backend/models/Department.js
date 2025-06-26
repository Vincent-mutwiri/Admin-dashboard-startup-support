import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a department name'],
      trim: true,
      unique: true,
      maxlength: [50, 'Department name cannot be more than 50 characters']
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Cascade delete startups when a department is deleted
departmentSchema.pre('remove', async function(next) {
  console.log(`Startups being removed from department ${this._id}`);
  await this.model('Startup').deleteMany({ department: this._id });
  next();
});

// Reverse populate with virtuals
departmentSchema.virtual('startups', {
  ref: 'Startup',
  localField: '_id',
  foreignField: 'department',
  justOne: false
});

export default mongoose.model('Department', departmentSchema);
