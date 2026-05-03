import { Handler } from '@netlify/functions';
import nodemailer from 'nodemailer';

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { candidateEmail, candidateName, date, time } = JSON.parse(event.body || '{}');

    if (!candidateEmail || !date || !time) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required scheduling details.' }) };
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'harisrahat95@gmail.com',
        pass: process.env.EMAIL_APP_PWD || 'ngkj ynkv wogi cymz',
      },
    });

    const mailOptions = {
      from: '"HR Auto-Scheduler" <harisrahat95@gmail.com>',
      to: candidateEmail,
      subject: `Invitation for Interview - ${candidateName}`,
      text: `Dear ${candidateName},\n\nWe were impressed by your CV and would like to invite you for an interview on ${date} at ${time}.\n\nPlease let us know if this time works for you.\n\nBest regards,\nHR Team`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Interview Invitation</h2>
          <p>Dear <strong>${candidateName}</strong>,</p>
          <p>We were very impressed by your recent application. We would like to invite you to an interview on:</p>
          <h3>${date} at ${time}</h3>
          <p>Please reply to this email to confirm your availability.</p>
          <br/>
          <p>Best regards,<br/><strong>HR Team</strong></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Interview scheduled and email sent successfully.' }) };
  } catch (error: any) {
    console.error('Error scheduling interview:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message || 'Failed to schedule interview.' }) };
  }
};
