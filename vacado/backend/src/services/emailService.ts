import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// SendGrid over SMTP via Nodemailer.
const transport = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: { user: 'apikey', pass: env.email.sendgridKey },
});

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  if (!env.email.sendgridKey) {
    logger.warn(`[email] skipped "${subject}" → ${to} (no SENDGRID_API_KEY)`);
    return;
  }
  await transport.sendMail({ from: env.email.from, to, subject, html });
}

export const emails = {
  welcome: (name: string) =>
    `<h2>Welcome to Vacado, ${name}!</h2><p>Your 7-day free trial is active. Generate your first viral Short now.</p>`,
  shortPublished: (title: string, url: string) =>
    `<h2>Your Short is live 🎬</h2><p>"${title}" was published to YouTube.</p><p><a href="${url}">Watch it</a></p>`,
  shortFailed: (title: string) =>
    `<h2>Generation failed</h2><p>We couldn't generate "${title}". No credit was used — please retry.</p>`,
  paymentFailed: () =>
    `<h2>Payment failed</h2><p>We couldn't charge your card. Update your billing to keep automating.</p>`,
};
