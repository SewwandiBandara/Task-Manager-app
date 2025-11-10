const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send task reminder email
const sendTaskReminder = async (userEmail, userName, task) => {
  try {
    const transporter = createTransporter();

    const dueDate = new Date(task.dueDate);
    const formattedDate = dueDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const mailOptions = {
      from: `Task Manager <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `⏰ Task Reminder: "${task.title}" is due tomorrow`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .task-card {
              background: white;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #667eea;
              margin: 20px 0;
            }
            .task-title {
              font-size: 20px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 10px;
            }
            .task-description {
              color: #6b7280;
              margin-bottom: 15px;
            }
            .due-date {
              background: #fef3c7;
              padding: 10px;
              border-radius: 5px;
              display: inline-block;
              color: #92400e;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #6b7280;
              font-size: 14px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📋 Task Reminder</h1>
            <p>Hi ${userName}! This is a friendly reminder about your upcoming task.</p>
          </div>
          <div class="content">
            <div class="task-card">
              <div class="task-title">${task.title}</div>
              ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
              <div class="due-date">
                📅 Due: ${formattedDate}
              </div>
            </div>
            <p>This task is due <strong>tomorrow</strong>. Don't forget to complete it!</p>
            <p style="text-align: center;">
              <a href="${process.env.APP_URL || 'http://localhost:5173'}" class="button">
                View Task
              </a>
            </p>
          </div>
          <div class="footer">
            <p>You received this email because you have email notifications enabled.</p>
            <p>Task Manager - Stay organized and productive</p>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Task reminder sent to ${userEmail}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending task reminder email:', error);
    return { success: false, error: error.message };
  }
};

// Send note reminder email
const sendNoteReminder = async (userEmail, userName, notes) => {
  try {
    const transporter = createTransporter();

    const notesList = notes.map(note => `
      <div class="note-card" style="background: ${note.color}; padding: 15px; border-radius: 8px; margin: 10px 0;">
        <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">${note.title}</div>
        <div style="color: #4b5563;">${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}</div>
      </div>
    `).join('');

    const mailOptions = {
      from: `Task Manager <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `📝 You have ${notes.length} pinned note${notes.length > 1 ? 's' : ''} to review`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #6b7280;
              font-size: 14px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #8b5cf6;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📝 Note Reminder</h1>
            <p>Hi ${userName}! Here are your pinned notes.</p>
          </div>
          <div class="content">
            ${notesList}
            <p style="text-align: center; margin-top: 20px;">
              <a href="${process.env.APP_URL || 'http://localhost:5173'}/notes" class="button">
                View All Notes
              </a>
            </p>
          </div>
          <div class="footer">
            <p>You received this email because you have email notifications enabled.</p>
            <p>Task Manager - Stay organized and productive</p>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Note reminder sent to ${userEmail}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending note reminder email:', error);
    return { success: false, error: error.message };
  }
};

// Send test email
const sendTestEmail = async (userEmail) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `Task Manager <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: '✅ Email Notifications Enabled',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 30px;
              border-radius: 10px;
              text-align: center;
            }
            .content {
              padding: 30px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✅ Success!</h1>
            <p>Email notifications are now enabled for your Task Manager account.</p>
          </div>
          <div class="content">
            <p>You will receive email reminders for:</p>
            <ul>
              <li>Tasks due within 24 hours</li>
              <li>Your pinned notes (daily digest)</li>
            </ul>
            <p>You can manage your notification preferences in your account settings.</p>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Test email sent to ${userEmail}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending test email:', error);
    return { success: false, error: error.message };
  }
};

// Send workflow creation notification
const sendWorkflowNotification = async (userEmail, userName, workflow) => {
  try {
    const transporter = createTransporter();

    const startDate = new Date(workflow.startDate);
    const formattedDate = startDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const categoryIcons = {
      daily: '☀️',
      weekly: '📅',
      project: '🎯',
      meeting: '👥',
      custom: '⚡'
    };

    const stepsList = workflow.steps.map((step, index) => `
      <div style="background: white; padding: 12px; border-radius: 6px; margin: 8px 0; border-left: 3px solid ${workflow.color || '#3b82f6'};">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="background: ${workflow.color || '#3b82f6'}; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">${index + 1}</span>
          <span style="font-weight: 500;">${step.title}</span>
          <span style="color: #6b7280; font-size: 14px; margin-left: auto;">${step.duration} min</span>
        </div>
      </div>
    `).join('');

    const recurringInfo = workflow.isRecurring && workflow.recurringDays.length > 0
      ? `<div style="background: #dbeafe; padding: 10px; border-radius: 5px; margin: 15px 0;">
           <strong>🔄 Recurring:</strong> ${workflow.recurringDays.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ')}
         </div>`
      : '';

    const mailOptions = {
      from: `Task Manager <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `${categoryIcons[workflow.category] || '⚡'} New Workflow Created: "${workflow.title}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, ${workflow.color || '#3b82f6'} 0%, ${workflow.color ? adjustColor(workflow.color, -20) : '#1e40af'} 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .workflow-card {
              background: white;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid ${workflow.color || '#3b82f6'};
              margin: 20px 0;
            }
            .workflow-title {
              font-size: 22px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 10px;
            }
            .workflow-description {
              color: #6b7280;
              margin-bottom: 15px;
            }
            .info-row {
              display: flex;
              gap: 20px;
              margin: 10px 0;
              flex-wrap: wrap;
            }
            .info-item {
              background: #f3f4f6;
              padding: 8px 12px;
              border-radius: 5px;
              font-size: 14px;
            }
            .steps-section {
              margin-top: 20px;
            }
            .steps-title {
              font-size: 18px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 10px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #6b7280;
              font-size: 14px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: ${workflow.color || '#3b82f6'};
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${categoryIcons[workflow.category] || '⚡'} Workflow Created!</h1>
            <p>Hi ${userName}! Your new workflow has been successfully created.</p>
          </div>
          <div class="content">
            <div class="workflow-card">
              <div class="workflow-title">${workflow.title}</div>
              ${workflow.description ? `<div class="workflow-description">${workflow.description}</div>` : ''}

              <div class="info-row">
                <div class="info-item">📅 Start Date: ${formattedDate}</div>
                <div class="info-item">⏰ Time: ${workflow.startTime}</div>
                <div class="info-item">📊 Category: ${workflow.category.charAt(0).toUpperCase() + workflow.category.slice(1)}</div>
              </div>

              ${recurringInfo}

              ${workflow.steps.length > 0 ? `
                <div class="steps-section">
                  <div class="steps-title">📋 Workflow Steps (${workflow.steps.length})</div>
                  ${stepsList}
                </div>
              ` : ''}
            </div>

            <p style="text-align: center; color: #6b7280;">
              Your workflow is now scheduled and ready to go! You can view and manage it in your workflows dashboard.
            </p>

            <p style="text-align: center;">
              <a href="${process.env.APP_URL || 'http://localhost:5173'}/workflows" class="button">
                View Workflow
              </a>
            </p>
          </div>
          <div class="footer">
            <p>You received this email because you created a new workflow.</p>
            <p>Task Manager - Stay organized and productive</p>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Workflow notification sent to ${userEmail}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending workflow notification email:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to adjust color brightness
function adjustColor(color, amount) {
  return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

module.exports = {
  sendTaskReminder,
  sendNoteReminder,
  sendTestEmail,
  sendWorkflowNotification
};
