import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  type: { 
    type: String, 
    enum: {
      values: ['Link', 'File', 'Document'],
      message: '{VALUE} is not a valid resource type'
    },
    default: 'Link',
    required: true
  },
  link: { 
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        // Only validate if type is 'Link'
        if (this.type !== 'Link') return true;
        // Simple URL validation
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
  filePath: {
    type: String,
    trim: true
  },
  fileName: {
    type: String,
    trim: true
  },
  fileSize: {
    type: Number // in bytes
  },
  fileType: {
    type: String
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
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  accessLevel: {
    type: String,
    enum: ['public', 'department', 'restricted'],
    default: 'department'
  },
  accessList: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for frequently queried fields
resourceSchema.index({ department: 1, type: 1 });
resourceSchema.index({ tags: 1 });
resourceSchema.index({ isPublic: 1 });
resourceSchema.index({ accessLevel: 1 });

// Virtual for file URL (if using a CDN or file storage service)
resourceSchema.virtual('fileUrl').get(function() {
  if (this.type === 'File' && this.filePath) {
    // This would be replaced with your actual file URL generation logic
    return `/api/resources/files/${this._id}/download`;
  }
  return null;
});

// Validate that either link or file is provided based on type
resourceSchema.pre('validate', function(next) {
  if (this.type === 'Link' && !this.link) {
    this.invalidate('link', 'Link is required for resource type "Link"');
  } else if (this.type === 'File' && !this.filePath) {
    this.invalidate('filePath', 'File is required for resource type "File"');
  }
  next();
});

export default mongoose.model('Resource', resourceSchema);
