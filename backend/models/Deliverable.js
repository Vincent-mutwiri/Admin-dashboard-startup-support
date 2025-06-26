import mongoose from 'mongoose';

const deliverableSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: { 
    type: String,
    trim: true
  },
  dueDate: { 
    type: Date 
  },
  isCompleted: { 
    type: Boolean, 
    default: false 
  },
  milestone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone',
    required: true,
    index: true,
  },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for frequently queried fields
deliverableSchema.index({ milestone: 1, isCompleted: 1 });

export default mongoose.model('Deliverable', deliverableSchema);
