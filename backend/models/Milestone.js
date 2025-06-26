import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: { 
    type: String, 
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['Not Started', 'In Progress', 'Completed', 'On Hold'],
      message: '{VALUE} is not a valid status'
    },
    default: 'Not Started',
  },
  dueDate: { 
    type: Date,
    validate: {
      validator: function(value) {
        // Allow null/undefined or a valid future date
        return !value || value >= new Date().setHours(0, 0, 0, 0);
      },
      message: 'Due date must be in the future'
    }
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department reference is required'],
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  completedAt: {
    type: Date,
    default: null
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for frequently queried fields
milestoneSchema.index({ department: 1, status: 1 });
milestoneSchema.index({ dueDate: 1 });

// Virtual for checking if milestone is overdue
milestoneSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'Completed') return false;
  return this.dueDate < new Date();
});

// Update completedAt when status changes to 'Completed'
milestoneSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'Completed' && !this.completedAt) {
    this.completedAt = new Date();
  } else if (this.isModified('status') && this.status !== 'Completed' && this.completedAt) {
    this.completedAt = null;
  }
  next();
});

export default mongoose.model('Milestone', milestoneSchema);
