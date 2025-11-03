# Email Notification Setup Guide

This guide will help you configure email notifications for task reminders in your Task Manager application.

## Features

- **Task Reminders**: Automatic email notifications 24 hours before tasks are due
- **Notes Digest**: Daily email with your pinned notes
- **Schedule**:
  - Task reminders sent at 9:00 AM daily
  - Notes digest sent at 8:00 AM daily
- **User Control**: Users can enable/disable email notifications in their account settings

## Setup Instructions

### 1. Gmail Setup (Recommended)

#### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings: https://myaccount.google.com/
2. Click on "Security"
3. Enable "2-Step Verification" if not already enabled

#### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" as the app
3. Select "Other" as the device and name it "Task Manager"
4. Click "Generate"
5. Copy the 16-character password (remove spaces)

#### Step 3: Update .env File
Open `backend/.env` and update these values:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
APP_URL=http://localhost:5173
```

### 2. Other Email Services

#### Outlook/Hotmail
```env
EMAIL_SERVICE=hotmail
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

#### Yahoo
```env
EMAIL_SERVICE=yahoo
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
```

#### Custom SMTP
For custom SMTP servers, you'll need to modify `services/emailService.js`:

```javascript
const transporter = nodemailer.createTransporter({
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

## Testing Email Notifications

### Test the Setup

1. **Start the backend server**:
   ```bash
   cd backend
   npm start
   ```

2. **Register/Login** to your account

3. **Send a test email** using the API:
   ```bash
   curl -X PATCH http://localhost:5000/api/auth/settings/notifications \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"emailNotifications": true}'
   ```

   This will send a test email to confirm the setup is working.

### Test Task Reminders

1. **Create a task** with a due date set to tomorrow
2. **Manually trigger reminders** (for testing):
   ```bash
   curl -X POST http://localhost:5000/api/auth/test-reminder \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

3. **Wait for scheduled time** (9:00 AM) or check server logs

## Email Templates

### Task Reminder Email
Users receive a beautifully formatted email with:
- Task title and description
- Due date
- Direct link to view the task
- Purple gradient header with task icon

### Notes Digest Email
Users receive:
- List of up to 5 pinned notes
- Note titles and content preview
- Color-coded note cards
- Link to view all notes

### Test Confirmation Email
Sent when enabling notifications:
- Confirmation message
- List of notification types
- Settings management info

## Scheduling

The scheduler runs automatically when the server starts. It uses `node-cron` to schedule:

- **Task Reminders**: `0 9 * * *` (9:00 AM daily)
- **Notes Digest**: `0 8 * * *` (8:00 AM daily)

To modify the schedule, edit `services/reminderScheduler.js`:

```javascript
// Change to run at 10:00 AM
cron.schedule('0 10 * * *', () => {
  checkTaskReminders();
});
```

## Troubleshooting

### Emails Not Sending

1. **Check Email Credentials**
   - Verify EMAIL_USER and EMAIL_PASSWORD in .env
   - For Gmail, ensure you're using an App Password, not your regular password

2. **Check Server Logs**
   ```bash
   # Look for errors in the console
   cd backend
   node app.js
   ```

3. **Test Email Service**
   - Try sending a test email from your email account manually
   - Check if 2FA is enabled (required for Gmail)

4. **Firewall/Network Issues**
   - Ensure your server can access SMTP servers
   - Check if port 587 (or 465) is open

### Reminders Not Triggering

1. **Check User Settings**
   - Ensure `emailNotifications` is set to `true` for the user
   - Query MongoDB: `db.users.find({ email: "user@example.com" })`

2. **Check Task Due Dates**
   - Tasks must be due exactly tomorrow (within 24 hours)
   - Status must be 'pending'

3. **Manual Trigger**
   - Use the test endpoint to trigger reminders manually
   - Check server logs for any errors

### Common Errors

**"Invalid login" error**:
- For Gmail: Make sure you're using an App Password
- Check that 2FA is enabled on your Google account

**"Connection timeout"**:
- Check your internet connection
- Verify firewall settings
- Try a different email service

**"Email not found"**:
- Ensure the user's email is correct in the database
- Check that emailNotifications is true

## API Endpoints

### Update Notification Settings
```http
PATCH /api/auth/settings/notifications
Authorization: Bearer <token>
Content-Type: application/json

{
  "emailNotifications": true
}
```

### Test Reminders (Development)
```http
POST /api/auth/test-reminder
Authorization: Bearer <token>
```

### Get User Settings
```http
GET /api/auth/me
Authorization: Bearer <token>
```

Returns:
```json
{
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "emailNotifications": true
  }
}
```

## Security Notes

⚠️ **IMPORTANT**:
- Never commit your `.env` file to version control
- Use App Passwords for Gmail (never your main password)
- Consider using environment variables in production
- Rotate your email passwords regularly
- Use SSL/TLS for production deployments

## Production Deployment

For production, consider:

1. **Use Environment Variables** instead of .env file
2. **Set up a dedicated email account** for the app
3. **Use a professional email service** like SendGrid, Mailgun, or AWS SES
4. **Enable rate limiting** to prevent spam
5. **Add unsubscribe links** to comply with email regulations
6. **Monitor email delivery rates**

## Support

If you encounter issues:
1. Check the server logs
2. Verify your email configuration
3. Test with a different email service
4. Ensure all npm packages are installed

For Gmail specifically:
- App Passwords guide: https://support.google.com/accounts/answer/185833
- 2FA setup: https://support.google.com/accounts/answer/185839
