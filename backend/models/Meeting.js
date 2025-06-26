import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Meeting title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  agenda: { 
    type: String,
    trim: true,
    maxlength: [5000, 'Agenda cannot be more than 5000 characters']
  },
  meetingDate: { 
    type: Date, 
    required: [true, 'Meeting date and time are required'],
    index: true
  },
  duration: {
    type: Number, // Duration in minutes
    min: [5, 'Minimum meeting duration is 5 minutes'],
    max: [1440, 'Meeting cannot be longer than 24 hours'],
    default: 60
  },
  location: {
    type: String,
    trim: true,
    maxlength: [500, 'Location cannot be more than 500 characters']
  },
  meetingLink: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Virtual meetings are optional
        try {
          new URL(v);
          return true;
        } catch (e) {
          return false;
        }
      },
      message: props => `'${props.value}' is not a valid URL`
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
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'tentative'],
      default: 'pending'
    },
    responseDate: Date
  }],
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'canceled'],
    default: 'scheduled'
  },
  meetingType: {
    type: String,
    enum: ['in_person', 'virtual', 'hybrid'],
    required: true
  },
  recurring: {
    isRecurring: { type: Boolean, default: false },
    frequency: { 
      type: String, 
      enum: ['daily', 'weekly', 'biweekly', 'monthly'],
      required: function() { return this.recurring.isRecurring; }
    },
    endDate: {
      type: Date,
      required: function() { 
        return this.recurring.isRecurring && !this.recurring.occurrences;
      },
      validate: {
        validator: function(v) {
          return v > this.meetingDate;
        },
        message: 'Recurrence end date must be after the meeting start date'
      }
    },
    occurrences: {
      type: Number,
      min: 1,
      required: function() { 
        return this.recurring.isRecurring && !this.recurring.endDate;
      }
    }
  },
  attachments: [{
    name: String,
    url: String,
    size: Number,
    type: String
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [10000, 'Notes cannot be more than 10000 characters']
  },
  isPrivate: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for common queries
meetingSchema.index({ department: 1, meetingDate: 1 });
meetingSchema.index({ 'attendees.user': 1, status: 1 });
meetingSchema.index({ meetingDate: 1, status: 1 });
meetingSchema.index({ 'recurring.isRecurring': 1, status: 1 });

// Virtual for meeting end time
meetingSchema.virtual('endTime').get(function() {
  if (!this.meetingDate || !this.duration) return null;
  const endTime = new Date(this.meetingDate);
  endTime.setMinutes(endTime.getMinutes() + this.duration);
  return endTime;
});

// Virtual to check if meeting is upcoming
meetingSchema.virtual('isUpcoming').get(function() {
  if (this.status !== 'scheduled') return false;
  return this.meetingDate > new Date();
});

// Virtual to check if meeting is in progress
meetingSchema.virtual('isInProgress').get(function() {
  if (this.status !== 'scheduled') return false;
  const now = new Date();
  return now >= this.meetingDate && now <= this.endTime;
});

// Pre-save hook to update status based on meeting time
meetingSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.isNew || this.isModified('meetingDate') || this.isModified('duration') || this.isModified('status')) {
    if (this.status === 'scheduled') {
      if (now > this.endTime) {
        this.status = 'completed';
      } else if (now >= this.meetingDate && now <= this.endTime) {
        this.status = 'in_progress';
      }
    }
  }
  
  next();
});

// Method to add attendee
meetingSchema.methods.addAttendee = function(userId, status = 'pending') {
  const attendeeIndex = this.attendees.findIndex(a => a.user.toString() === userId.toString());
  
  if (attendeeIndex === -1) {
    this.attendees.push({
      user: userId,
      status,
      responseDate: new Date()
    });
  } else {
    this.attendees[attendeeIndex].status = status;
    this.attendees[attendeeIndex].responseDate = new Date();
  }
  
  return this.save();
};

// Method to remove attendee
meetingSchema.methods.removeAttendee = function(userId) {
  this.attendees = this.attendees.filter(a => a.user.toString() !== userId.toString());
  return this.save();
};

export default mongoose.model('Meeting', meetingSchema);
