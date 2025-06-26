import mongoose from 'mongoose';

// Function to create a URL-friendly slug from a string
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '');      // Trim - from end of text
};

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Department name cannot be more than 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Pre-save hook to generate slug from name
// This runs before a department is saved or updated
departmentSchema.pre('save', function(next) {
  // Only generate slug if name is modified or this is a new department
  if (!this.isModified('name') && !this.isNew) return next();
  
  // Generate slug from name
  this.slug = slugify(this.name);
  
  // Ensure slug is unique
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  this.constructor.find({ slug: slugRegEx }).then(departments => {
    if (departments.length) {
      // If departments with similar slugs exist, append a number
      const lastSlug = departments[departments.length - 1].slug;
      const slugParts = lastSlug.split('-');
      const number = parseInt(slugParts[slugParts.length - 1]) || 0;
      this.slug = `${this.slug}-${number + 1}`;
    }
    next();
  }).catch(err => next(err));
});

// Add text index for searchable fields
departmentSchema.index({ 
  name: 'text', 
  description: 'text' 
});

// Virtual for department's URL
departmentSchema.virtual('url').get(function() {
  return `/departments/${this.slug}`;
});

// Virtual for getting active users in this department
departmentSchema.virtual('members', {
  ref: 'User', // The model to use
  localField: '_id', // Find users where `localField`
  foreignField: 'assignedDepartment', // is equal to `foreignField`
  justOne: false // Set to false to return many
});

// Static method to find active departments
departmentSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Instance method to check if department has a head
departmentSchema.methods.hasHead = function() {
  return !!this.head;
};

const Department = mongoose.model('Department', departmentSchema);

export default Department;