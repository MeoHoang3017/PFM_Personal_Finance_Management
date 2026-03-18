// src/services/mailer.ts
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Transporter using Gmail app password instead of OAuth2
 * Previous OAuth2-based configuration is intentionally disabled to avoid invalid_grant errors.
 */
// const oauth2Transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     type: 'OAuth2',
//     user: process.env.EMAIL_USER,
//     clientId: process.env.OAUTH_CLIENT_ID,
//     clientSecret: process.env.OAUTH_CLIENT_SECRET,
//     refreshToken: process.env.OAUTH_REFRESH_TOKEN,
//   },
// } as any);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

/**
 * Send a general email
 */
export const sendMail = async (
  to: string,
  subject: string,
  html: string
): Promise<any> => {
  const mailOptions = {
    from: `"${process.env.SEND_NAME}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email Sent: ", info.messageId);
    return info;
  } catch (error) {
    console.error("Mail Error:", error);
    throw error;
  }
};

/**
 * Test function (Optional)
 */
export const testSendMail = async (): Promise<any> => {
  return await sendMail(
    'meomapgm@gmail.com', 
    'Test Email', 
    '<h1>Success</h1><p>This is a test email using OAuth2.</p>'
  );
};