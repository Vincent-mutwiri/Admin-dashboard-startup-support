import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot be more than 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false // Never return password in queries unless explicitly requested
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['viewer', 'editor', 'admin'],
        message: 'Role must be either viewer, editor, or admin'
      },
      default: 'viewer'
    },
    // User can be associated with a startup (for startup members)
    startup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Startup',
      required: false
    },
    // User can be assigned to a department (for department staff)
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: false
    },
    // Alias for department to maintain backward compatibility
    assignedDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: false
    },
    isActive: {
      type: Boolean,
      default: true,
      select: false
    },
    lastLogin: {
      type: Date,
      default: Date.now
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();
  
  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  
  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

// Update changedPasswordAt property for the user when password is changed
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  
  this.passwordChangedAt = Date.now() - 1000; // Ensure token is created after password change
  next();
});

// Method to check if password is correct
userSchema.methods.correctPassword = async function(candidatePassword) {
  console.log('Comparing passwords...');
  console.log('Candidate password:', candidatePassword);
  console.log('Stored password hash:', this.password ? 'exists' : 'undefined');
  
  if (!this.password) {
    console.error('No password hash found for user');
    return false;
  }
  
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('bcrypt.compare result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

// Method to check if user changed password after the token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  // False means NOT changed
  return false;
};

// Create password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  console.log({ resetToken }, this.passwordResetToken);
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Virtual for user's full profile URL
userSchema.virtual('profileUrl').get(function() {
  return `/users/${this._id}`;
});

// Virtual for user's avatar URL
userSchema.virtual('avatarUrl').get(function() {
  // You can implement Gravatar or any other avatar service here
  const hash = crypto.createHash('md5').update(this.email).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
});

// Query middleware to filter out inactive users by default
userSchema.pre(/^find/, function(next) {
  // This points to the current query
  this.find({ isActive: { $ne: false } });
  next();
});

// Indexes for better query performance
userSchema.index({ role: 1 });
userSchema.index({ startup: 1 });
userSchema.index({ department: 1 });
userSchema.index({ assignedDepartment: 1 });

const User = mongoose.model('User', userSchema);

export default User;