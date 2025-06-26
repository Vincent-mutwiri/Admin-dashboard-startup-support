// backend/controllers/startupController.js
import mongoose from 'mongoose';
import Startup from '../models/Startup.js';

// @desc    Create a new startup
// @route   POST /api/startups
// @access  Private/Admin or Editor
const createStartup = async (req, res) => {
  try {
    const { name, description, cohort, department } = req.body;

    // Input validation
    if (!name?.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        error: 'Name is required',
        field: 'name'
      });
    }

    if (!description?.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        error: 'Description is required',
        field: 'description'
      });
    }

    if (cohort === undefined || cohort === '') {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        error: 'Cohort is required',
        field: 'cohort'
      });
    }

    // Ensure cohort is a string and one of the allowed values
    const cohortStr = String(cohort);
    const allowedCohorts = ['2023', '2024', '2025'];
    if (!allowedCohorts.includes(cohortStr)) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        error: `Cohort must be one of: ${allowedCohorts.join(', ')}`,
        field: 'cohort',
        allowedValues: allowedCohorts
      });
    }

    // Check for existing startup with the same name (case insensitive)
    const startupExists = await Startup.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });

    if (startupExists) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        error: 'A startup with this name already exists',
        field: 'name'
      });
    }

    // Create the startup
    const startup = await Startup.create({
      name: name.trim(),
      description: description.trim(),
      cohort: cohortStr, // Use the string value
      department: department?.trim() || null,
    });

    res.status(201).json({
      success: true,
      data: startup,
      message: 'Startup created successfully'
    });

  } catch (error) {
    console.error('Error creating startup:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue,
      errors: error.errors,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
    });
    
    // More detailed error response in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorResponse = {
      success: false,
      message: 'Server error',
      error: isDevelopment ? error.message : 'Internal server error',
      ...(isDevelopment && {
        stack: error.stack,
        details: error.errors || error
      })
    };
    
    res.status(500).json(errorResponse);
  }
};

// @desc    Get all startups with optional filtering
// @route   GET /api/startups
// @access  Private
const getStartups = async (req, res) => {
  try {
    console.log('getStartups - Request received', {
      method: req.method,
      url: req.originalUrl,
      query: req.query,
      params: req.params
    });

    const { cohort, department } = req.query;
    const filter = {};

    if (cohort) {
      filter.cohort = cohort;
    }

    if (department) {
      // Convert department ID to ObjectId if it's a valid ID
      if (mongoose.Types.ObjectId.isValid(department)) {
        filter.department = department;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid department ID format',
          error: 'The provided department ID is not valid'
        });
      }
    }

    console.log('Database query filter:', filter);

    const startups = await Startup.find(filter)
      .sort({ createdAt: -1 })
      .populate({
        path: 'department',
        select: 'name description',
        model: 'Department'
      });

    console.log(`Found ${startups.length} startups`);

    res.status(200).json({
      success: true,
      count: startups.length,
      data: startups
    });
  } catch (error) {
    console.error('Error in getStartups:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      query: req.query,
      params: req.params
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch startups',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        name: error.name
      })
    });
  }
};

// @desc    Get startup by ID
// @route   GET /api/startups/:id
// @access  Private
const getStartupById = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id)
      .populate('department', 'name');
    
    if (startup) {
      res.status(200).json(startup);
    } else {
      res.status(404).json({ message: 'Startup not found' });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching startup',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update a startup
// @route   PUT /api/startups/:id
// @access  Private/Admin or Editor
const updateStartup = async (req, res) => {
  try {
    const { name, description, cohort, department } = req.body;
    const startup = await Startup.findById(req.params.id);

    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }

    // Check if the new name is already taken by another startup
    if (name && name !== startup.name) {
      const startupExists = await Startup.findOne({ name });
      if (startupExists) {
        return res.status(400).json({ message: 'Startup with this name already exists.' });
      }
      startup.name = name;
    }

    if (description) startup.description = description;
    if (cohort !== undefined) startup.cohort = cohort;
    if (department !== undefined) startup.department = department || null;

    const updatedStartup = await startup.save();
    await updatedStartup.populate('department', 'name');
    
    res.status(200).json(updatedStartup);
  } catch (error) {
    res.status(500).json({
      message: 'Error updating startup',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete a startup
// @route   DELETE /api/startups/:id
// @access  Private/Admin
const deleteStartup = async (req, res) => {
  try {
    const startup = await Startup.findByIdAndDelete(req.params.id);
    
    if (startup) {
      res.status(200).json({ message: 'Startup removed' });
    } else {
      res.status(404).json({ message: 'Startup not found' });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting startup',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export { 
  createStartup, 
  getStartups, 
  getStartupById, 
  updateStartup, 
  deleteStartup 
};
