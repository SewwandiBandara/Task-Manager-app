const express = require('express');
const router = express.Router();
const Workflow = require('../models/Workflow');
const auth = require('../middleware/auth');

// Get all workflows for authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, category, status } = req.query;

    const filter = { userId: req.userId };

    // Filter by date range
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    // Filter by category
    if (category) filter.category = category;

    // Filter by status
    if (status) filter.status = status;

    const workflows = await Workflow.find(filter).sort({ startDate: 1, startTime: 1 });
    res.json(workflows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single workflow
router.get('/:id', auth, async (req, res) => {
  try {
    const workflow = await Workflow.findOne({ _id: req.params.id, userId: req.userId });
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    res.json(workflow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new workflow
router.post('/', auth, async (req, res) => {
  try {
    const workflow = new Workflow({
      ...req.body,
      userId: req.userId
    });

    const newWorkflow = await workflow.save();
    res.status(201).json(newWorkflow);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update workflow
router.put('/:id', auth, async (req, res) => {
  try {
    const workflow = await Workflow.findOne({ _id: req.params.id, userId: req.userId });
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    Object.assign(workflow, req.body);
    await workflow.save();

    res.json(workflow);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Toggle step completion
router.patch('/:id/steps/:stepId/toggle', auth, async (req, res) => {
  try {
    const workflow = await Workflow.findOne({ _id: req.params.id, userId: req.userId });
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    const step = workflow.steps.id(req.params.stepId);
    if (!step) {
      return res.status(404).json({ message: 'Step not found' });
    }

    step.isCompleted = !step.isCompleted;
    if (step.isCompleted) {
      step.completedAt = new Date();
    } else {
      step.completedAt = undefined;
    }

    await workflow.save();
    res.json(workflow);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update workflow status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['scheduled', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const workflow = await Workflow.findOne({ _id: req.params.id, userId: req.userId });
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    workflow.status = status;
    await workflow.save();

    res.json(workflow);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete workflow
router.delete('/:id', auth, async (req, res) => {
  try {
    const workflow = await Workflow.findOne({ _id: req.params.id, userId: req.userId });
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    await Workflow.findByIdAndDelete(req.params.id);
    res.json({ message: 'Workflow deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get workflow statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const workflows = await Workflow.find({ userId: req.userId });

    const stats = {
      total: workflows.length,
      scheduled: workflows.filter(w => w.status === 'scheduled').length,
      inProgress: workflows.filter(w => w.status === 'in-progress').length,
      completed: workflows.filter(w => w.status === 'completed').length,
      cancelled: workflows.filter(w => w.status === 'cancelled').length,
      averageProgress: workflows.length > 0
        ? Math.round(workflows.reduce((sum, w) => sum + w.progress, 0) / workflows.length)
        : 0
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Duplicate workflow
router.post('/:id/duplicate', auth, async (req, res) => {
  try {
    const original = await Workflow.findOne({ _id: req.params.id, userId: req.userId });
    if (!original) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    const duplicate = new Workflow({
      title: `${original.title} (Copy)`,
      description: original.description,
      category: original.category,
      startDate: new Date(),
      startTime: original.startTime,
      isRecurring: original.isRecurring,
      recurringDays: original.recurringDays,
      steps: original.steps.map(step => ({
        title: step.title,
        description: step.description,
        duration: step.duration,
        isCompleted: false,
        order: step.order
      })),
      color: original.color,
      userId: req.userId
    });

    await duplicate.save();
    res.status(201).json(duplicate);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
