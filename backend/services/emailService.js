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

module.exports = {
  sendTaskReminder,
  sendNoteReminder,
  sendTestEmail
};
