const cron = require('node-cron');
const Task = require('../models/Task');
const Note = require('../models/Note');
const User = require('../models/User');
const { sendTaskReminder, sendNoteReminder } = require('./emailService');

// Check for tasks due in the next 24 hours and send reminders
const checkTaskReminders = async () => {
  try {
    console.log('Checking for task reminders...');

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Find tasks that are due tomorrow and are still pending
    const upcomingTasks = await Task.find({
      dueDate: {
        $gte: tomorrow,
        $lt: dayAfterTomorrow
      },
      status: 'pending'
    }).populate('userId', 'name email emailNotifications');

    console.log(`Found ${upcomingTasks.length} tasks due tomorrow`);

    for (const task of upcomingTasks) {
      if (task.userId && task.userId.emailNotifications && task.userId.email) {
        console.log(`Sending reminder for task "${task.title}" to ${task.userId.email}`);
        await sendTaskReminder(task.userId.email, task.userId.name, task);
      }
    }

    console.log('Task reminder check completed');
  } catch (error) {
    console.error('Error checking task reminders:', error);
  }
};

// Send daily digest of pinned notes
const sendNotesDigest = async () => {
  try {
    console.log('Sending notes digest...');

    // Find all users with email notifications enabled
    const users = await User.find({ emailNotifications: true });

    for (const user of users) {
      // Get pinned notes for this user
      const pinnedNotes = await Note.find({
        userId: user._id,
        isPinned: true
      }).limit(5);

      if (pinnedNotes.length > 0) {
        console.log(`Sending notes digest to ${user.email} (${pinnedNotes.length} notes)`);
        await sendNoteReminder(user.email, user.name, pinnedNotes);
      }
    }

    console.log('Notes digest completed');
  } catch (error) {
    console.error('Error sending notes digest:', error);
  }
};

// Initialize scheduler
const startScheduler = () => {
  console.log('Starting reminder scheduler...');

  // Check for task reminders every day at 9:00 AM
  cron.schedule('0 9 * * *', () => {
    console.log('Running scheduled task reminder check...');
    checkTaskReminders();
  });

  // Send notes digest every day at 8:00 AM
  cron.schedule('0 8 * * *', () => {
    console.log('Running scheduled notes digest...');
    sendNotesDigest();
  });

  // For testing: Check every 5 minutes (uncomment if needed)
  // cron.schedule('*/5 * * * *', () => {
  //   console.log('Running test reminder check...');
  //   checkTaskReminders();
  // });

  console.log('Reminder scheduler started successfully');
  console.log('- Task reminders: Daily at 9:00 AM');
  console.log('- Notes digest: Daily at 8:00 AM');
};

// Manual trigger functions for testing
const triggerTaskReminders = async () => {
  console.log('Manually triggering task reminders...');
  await checkTaskReminders();
};

const triggerNotesDigest = async () => {
  console.log('Manually triggering notes digest...');
  await sendNotesDigest();
};

module.exports = {
  startScheduler,
  checkTaskReminders,
  sendNotesDigest,
  triggerTaskReminders,
  triggerNotesDigest
};
