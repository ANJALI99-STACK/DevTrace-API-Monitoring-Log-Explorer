import nodemailer from 'nodemailer';
import { User } from '../src/models/User';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendAlertEmail = async (userId: string, endpointName: string, message: string): Promise<void> => {
  if (!process.env.SMTP_USER) {
    console.log('[mailer] SMTP not configured, skipping email send (dev mode)');
    return;
  }

  const user = await User.findById(userId).select('email name');
  if (!user) return;

  await transporter.sendMail({
    from: process.env.ALERT_EMAIL_FROM || '"DevTrace Alerts" <alerts@devtrace.app>',
    to: user.email,
    subject: `[DevTrace] Alert: ${endpointName} is failing`,
    text: message,
    html: `<p>Hi ${user.name},</p><p>${message}</p><p>— DevTrace Monitoring</p>`,
  });

  console.log(`[mailer] alert email sent to ${user.email}`);
};
