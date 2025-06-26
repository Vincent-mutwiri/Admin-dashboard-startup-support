import Deliverable from '../models/Deliverable.js';
import Milestone from '../models/Milestone.js';
import asyncHandler from 'express-async-handler';

// @desc    Create a new deliverable
// @route   POST /api/deliverables
// @access  Private
export const createDeliverable = asyncHandler(async (req, res) => {
  const { title, description, dueDate, milestone } = req.body;

  // Check if milestone exists
  const milestoneExists = await Milestone.findById(milestone);
  if (!milestoneExists) {
    res.status(404);
    throw new Error('Milestone not found');
  }

  const deliverable = await Deliverable.create({
    title,
    description,
    dueDate: dueDate || null,
    milestone,
    isCompleted: false
  });

  res.status(201).json(deliverable);
});

// @desc    Update a deliverable
// @route   PUT /api/deliverables/:id
// @access  Private
export const updateDeliverable = asyncHandler(async (req, res) => {
  const { title, description, dueDate, isCompleted } = req.body;
  const deliverable = await Deliverable.findById(req.params.id);

  if (!deliverable) {
    res.status(404);
    throw new Error('Deliverable not found');
  }

  // Update fields if they are provided
  if (title !== undefined) deliverable.title = title;
  if (description !== undefined) deliverable.description = description;
  if (dueDate !== undefined) deliverable.dueDate = dueDate;
  if (isCompleted !== undefined) deliverable.isCompleted = isCompleted;

  const updatedDeliverable = await deliverable.save();
  res.json(updatedDeliverable);
});

// @desc    Delete a deliverable
// @route   DELETE /api/deliverables/:id
// @access  Private
export const deleteDeliverable = asyncHandler(async (req, res) => {
  const deliverable = await Deliverable.findById(req.params.id);

  if (!deliverable) {
    res.status(404);
    throw new Error('Deliverable not found');
  }

  await deliverable.remove();
  res.json({ message: 'Deliverable removed' });
});

// @desc    Get all deliverables for a milestone
// @route   GET /api/milestones/:milestoneId/deliverables
// @access  Private
export const getDeliverablesByMilestone = asyncHandler(async (req, res) => {
  const deliverables = await Deliverable.find({ milestone: req.params.milestoneId })
    .sort({ createdAt: -1 });
  
  res.json(deliverables);
});
