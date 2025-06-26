import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema({
  status: { 
    type: String, 
    required: true 
  },
  changedAt: { 
    type: Date, 
    default: Date.now 
  },
  changedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Status notes cannot be more than 500 characters']
  }
});

const commentSchema = new mongoose.Schema({
  text: { 
    type: String, 
    required: [true, 'Comment text is required'],
    trim: true,
    maxlength: [2000, 'Comment cannot be more than 2000 characters']
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date 
  },
  parentComment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comment' 
  },
  isEdited: {
    type: Boolean,
    default: false
  }
});

const milestoneSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: { 
    type: String, 
    trim: true,
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Abandoned'],
      message: '{VALUE} is not a valid status'
    },
    default: 'Not Started',
  },
  statusHistory: [statusHistorySchema],
  comments: [commentSchema],
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
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: {
    type: Date,
    default: null
  },
  startDate: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  tags: [{
    type: String,
    trim: true
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for frequently queried fields
milestoneSchema.index({ department: 1, status: 1 });
milestoneSchema.index({ dueDate: 1 });
milestoneSchema.index({ priority: 1 });
milestoneSchema.index({ tags: 1 });

// Virtual for checking if milestone is overdue
milestoneSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'Completed' || this.status === 'Abandoned') return false;
  return this.dueDate < new Date();
});

// Virtual field to get deliverables associated with this milestone
milestoneSchema.virtual('deliverables', {
  ref: 'Deliverable',
  localField: '_id',
  foreignField: 'milestone'
});

// Update completedAt when status changes to 'Completed'
milestoneSchema.pre('save', function(next) {
  // Track status changes in history
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedBy: this.updatedBy || this.createdBy,
      notes: `Status changed to ${this.status}`
    });
    
    // Update completedAt based on status
    if (this.status === 'Completed' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'Completed' && this.completedAt) {
      this.completedAt = null;
    }
    
    // Set start date if this is the first time status changes to 'In Progress'
    if (this.status === 'In Progress' && !this.startDate) {
      this.startDate = new Date();
    }
  }
  
  next();
});

export default mongoose.model('Milestone', milestoneSchema);
