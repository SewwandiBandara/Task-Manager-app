const mongoose = require('mongoose');

const workflowStepSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  duration: {
    type: Number, // Duration in minutes
    default: 30
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  order: {
    type: Number,
    required: true
  }
});

const workflowSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  category: {
    type: String,
    enum: ['daily', 'weekly', 'project', 'meeting', 'custom'],
    default: 'custom'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  startTime: {
    type: String, // Format: "HH:MM"
    default: "09:00"
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  steps: [workflowStepSchema],
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  color: {
    type: String,
    default: '#3b82f6'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Calculate progress based on completed steps
workflowSchema.methods.calculateProgress = function() {
  if (this.steps.length === 0) {
    this.progress = 0;
  } else {
    const completedSteps = this.steps.filter(step => step.isCompleted).length;
    this.progress = Math.round((completedSteps / this.steps.length) * 100);
  }

  // Auto-update status based on progress
  if (this.progress === 100 && this.status !== 'cancelled') {
    this.status = 'completed';
  } else if (this.progress > 0 && this.progress < 100 && this.status === 'scheduled') {
    this.status = 'in-progress';
  }

  return this.progress;
};

// Pre-save hook to calculate progress
workflowSchema.pre('save', function(next) {
  this.calculateProgress();
  next();
});

module.exports = mongoose.model('Workflow', workflowSchema);
