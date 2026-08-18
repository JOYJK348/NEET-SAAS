/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-misused-promises */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface SendWelcomeEmailOptions {
  to: string;
  name: string;
  role: 'STUDENT' | 'PARENT' | 'TUTOR' | 'ADMIN';
  password?: string;
  loginUrl?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly apiKey: string;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey =
      this.configService.get<string>('RESEND_API_KEY') ||
      process.env.RESEND_API_KEY ||
      '';
    this.fromEmail =
      this.configService.get<string>('RESEND_FROM_EMAIL') ||
      process.env.RESEND_FROM_EMAIL ||
      'NEET Academy <onboarding@resend.dev>';
  }

  /**
   * Send generic raw HTML email via Resend API
   */
  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.warn(`RESEND_API_KEY is missing. Skipping email to ${to}`);
      return false;
    }

    if (!to || !to.includes('@')) {
      this.logger.warn(`Invalid recipient email address: '${to}'`);
      return false;
    }

    try {
      const response = await axios.post(
        'https://api.resend.com/emails',
        {
          from: this.fromEmail,
          to: [to.trim()],
          subject,
          html,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      this.logger.log(
        `Email sent successfully to ${to} (Subject: "${subject}") - Resend ID: ${response.data?.id}`,
      );
      return true;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || err;
      this.logger.error(`Failed to send email to ${to} via Resend: ${JSON.stringify(errMsg)}`);
      return false;
    }
  }

  /**
   * Send Welcome Credentials Email to Student, Parent, or Tutor
   * Non-blocking background dispatch for maximum speed.
   */
  sendWelcomeCredentialsAsync(options: SendWelcomeEmailOptions): void {
    setImmediate(() => {
      this.sendWelcomeCredentials(options).catch((err) => {
        this.logger.error(`Async welcome email error for ${options.to}:`, err);
      });
    });
  }

  /**
   * Safe Queue-based Batch Email Dispatch with Concurrency Control & Rate-limiting
   * Processes large bulk imports (e.g. 100 or 500 emails) in small throttled batches
   * to avoid Resend API rate-limits and server stalls.
   */
  sendBatchWelcomeCredentials(items: SendWelcomeEmailOptions[]): void {
    if (!items || items.length === 0) return;

    setImmediate(async () => {
      this.logger.log(`Starting batch welcome email dispatch for ${items.length} recipients...`);
      const BATCH_SIZE = 2;
      const DELAY_BETWEEN_BATCHES_MS = 300; // Resend rate-limit protection

      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const chunk = items.slice(i, i + BATCH_SIZE);
        await Promise.all(
          chunk.map(async (item) => {
            try {
              await this.sendWelcomeCredentials(item);
            } catch (err: any) {
              this.logger.error(
                `Error sending batch email to ${item.to}: ${err?.message || err}`,
              );
            }
          }),
        );
        if (i + BATCH_SIZE < items.length) {
          await new Promise((resolve) =>
            setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS),
          );
        }
      }
      this.logger.log(`Completed batch welcome email dispatch for ${items.length} recipients.`);
    });
  }

  /**
   * Send Password Reset Email via Resend API
   */
  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetUrl: string,
  ): Promise<boolean> {
    const subject = 'Reset Your NEET Academy Password';
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); overflow: hidden;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #6d28d9 100%); padding: 32px 36px; text-align: left;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
                NEET Academy
              </h1>
              <p style="margin: 6px 0 0 0; color: #e0e7ff; font-size: 13px; font-weight: 500;">
                Password Reset Request
              </p>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 36px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 700;">
                Hello, ${this.escapeHtml(name)} 👋
              </h2>

              <p style="margin: 0 0 20px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                We received a request to reset your password for your NEET Academy portal account. Click the button below to choose a new password.
              </p>

              <!-- Call to Action Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);">
                      Reset Password Now &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                  <strong>Note:</strong> This password reset link is valid for <strong>15 minutes</strong> only and can be used only once. If you did not request a password reset, you can safely ignore this email — your account remains secure.
                </p>
              </div>

              <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5; word-break: break-all;">
                Having trouble clicking the button? Copy and paste this URL into your browser:<br>
                <a href="${resetUrl}" style="color: #4f46e5;">${resetUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 36px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 11px; line-height: 1.5;">
                This is an automated notification from NEET Academy SaaS System.<br>
                © 2026 NEET Academy. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    return this.sendEmail(to, subject, html);
  }

  /**
   * Synchronous / Promise-based Welcome Credentials Dispatch
   */
  async sendWelcomeCredentials(options: SendWelcomeEmailOptions): Promise<boolean> {
    const { to, name, role, password, loginUrl } = options;

    const roleDisplayName =
      role === 'STUDENT'
        ? 'Student'
        : role === 'PARENT'
          ? 'Parent'
          : role === 'TUTOR'
            ? 'Faculty / Tutor'
            : 'Administrator';

    const defaultPortalUrl =
      loginUrl ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3001/auth/login';

    const subject = `Welcome to NEET Academy - Your ${roleDisplayName} Login Credentials`;

    const htmlContent = this.generateWelcomeEmailHtml({
      name,
      toEmail: to,
      roleDisplayName,
      password: password || 'Assigned by Administrator',
      portalUrl: defaultPortalUrl,
    });

    return this.sendEmail(to, subject, htmlContent);
  }

  /**
   * Anti-Spam Clean Light Theme HTML Template Generator
   * Designed according to high deliverability rules (clean tables, white background, no spam keywords)
   */
  private generateWelcomeEmailHtml(params: {
    name: string;
    toEmail: string;
    roleDisplayName: string;
    password?: string;
    portalUrl: string;
  }): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to NEET Academy</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); overflow: hidden;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #6d28d9 100%); padding: 32px 36px; text-align: left;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
                NEET Academy
              </h1>
              <p style="margin: 6px 0 0 0; color: #e0e7ff; font-size: 13px; font-weight: 500;">
                Learning Management & Examination Portal
              </p>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 36px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 700;">
                Welcome, ${this.escapeHtml(params.name)}! 👋
              </h2>

              <p style="margin: 0 0 24px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                Your <strong>${this.escapeHtml(params.roleDisplayName)}</strong> portal account has been created by your institute administrator. You can now access your timetable, live classes, course materials, and examination reports.
              </p>

              <!-- Credentials Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; border-radius: 12px; border: 1px solid #cbd5e1; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
                      Your Account Credentials
                    </p>
                    
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="100" style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #334155;">Account Role:</td>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #4f46e5;">${this.escapeHtml(params.roleDisplayName)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #334155;">Username / Email:</td>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #0f172a;">${this.escapeHtml(params.toEmail)}</td>
                      </tr>
                      ${
                        params.password
                          ? `
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #334155;">Password:</td>
                        <td style="padding: 6px 0; font-size: 13px; font-family: monospace; font-weight: 700; color: #0f172a; background-color: #ffffff; padding-left: 8px; border-radius: 4px;">${this.escapeHtml(params.password)}</td>
                      </tr>
                      `
                          : ''
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${params.portalUrl}" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);">
                      Sign In To Your Account &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Note -->
              <div style="background-color: #fffbe0; border: 1px solid #fef08a; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 12px; color: #854d0e; line-height: 1.5;">
                  <strong>Security Recommendation:</strong> For your security, please update your password after logging in for the first time.
                </p>
              </div>

              <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                If you have any questions or require assistance, please contact your institute academic administrator.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 36px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 11px; line-height: 1.5;">
                This is an automated notification from NEET Academy SaaS System.<br>
                © 2026 NEET Academy. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private escapeHtml(str: string): string {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
