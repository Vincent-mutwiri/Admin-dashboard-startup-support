import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['viewer', 'editor', 'admin'], // Role must be one of these values
      default: 'viewer',
    },
    // A user can be associated with ONE startup
    startup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Startup',
    },
    // OR a user can be associated with ONE department
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
  },
  {
    timestamps: true,
  }
);

// This Mongoose 'pre-save hook' runs before a user document is saved to the DB
userSchema.pre('save', async function (next) {
  // We only want to hash the password if it's new or has been modified
  if (!this.isModified('password')) {
    return next();
  }

  // Generate a 'salt' to add randomness to the hash
  const salt = await bcrypt.genSalt(10);
  // Hash the password with the salt and update the password field
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Create a custom method on the user schema to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  // Use bcrypt to compare the plain text password with the hashed one in the database
  return await bcrypt.compare(enteredPassword, this.password);
};


const User = mongoose.model('User', userSchema);

export default User;