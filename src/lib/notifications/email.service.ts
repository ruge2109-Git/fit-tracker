/**
 * Email Service
 * Handles sending emails using Resend API
 */

import { logger } from '@/lib/logger'

interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

class EmailService {
  private apiKey: string | null = null
  private fromEmail: string

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || null
    this.fromEmail = process.env.EMAIL_FROM || 'FitTrackr <noreply@fittrackr.com>'
  }

  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    return this.apiKey !== null
  }

  /**
   * Send an email
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      logger.warn('Email service not configured. RESEND_API_KEY is missing.', 'EmailService')
      return { success: false, error: 'Email service not configured' }
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: options.from || this.fromEmail,
          to: options.to,
          subject: options.subject,
          html: options.html,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email')
      }

      logger.info(`Email sent successfully to ${options.to}`, 'EmailService')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Failed to send email', error as Error, 'EmailService')
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Send feedback notification email to admin
   */
  async sendFeedbackNotification(
    adminEmail: string,
    feedback: {
      type: string
      subject: string
      message: string
      userEmail: string
      userName: string | null
      rating?: number
      createdAt: string
    }
  ): Promise<{ success: boolean; error?: string }> {
    const typeLabels: Record<string, string> = {
      bug: '🐛 Bug Report',
      feature: '✨ Feature Request',
      improvement: '💡 Improvement Suggestion',
      other: '📝 Other',
    }

    const typeLabel = typeLabels[feedback.type] || feedback.type
    const ratingStars = feedback.rating ? '⭐'.repeat(feedback.rating) : 'No rating'

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
              border-radius: 8px 8px 0 0;
              text-align: center;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .feedback-card {
              background: white;
              border-left: 4px solid #667eea;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .label {
              font-weight: 600;
              color: #667eea;
              margin-top: 15px;
              display: block;
            }
            .value {
              margin-top: 5px;
              color: #555;
            }
            .rating {
              font-size: 18px;
              margin-top: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>💪 FitTrackr</h1>
            <p>New Feedback Received</p>
          </div>
          <div class="content">
            <p>You have received new feedback from a user:</p>
            
            <div class="feedback-card">
              <span class="label">Type:</span>
              <span class="value">${typeLabel}</span>
              
              <span class="label">Subject:</span>
              <span class="value">${feedback.subject}</span>
              
              <span class="label">Message:</span>
              <div class="value" style="white-space: pre-wrap; margin-top: 10px;">${feedback.message}</div>
              
              ${feedback.rating ? `
                <span class="label">Rating:</span>
                <div class="rating">${ratingStars}</div>
              ` : ''}
              
              <span class="label">From User:</span>
              <span class="value">${feedback.userName || feedback.userEmail}</span>
              <span class="value" style="font-size: 12px; color: #9ca3af;">${feedback.userEmail}</span>
              
              <span class="label">Submitted:</span>
              <span class="value">${new Date(feedback.createdAt).toLocaleString()}</span>
            </div>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.com'}/admin/feedback" class="button">
              View in Admin Panel
            </a>
          </div>
          <div class="footer">
            <p>This is an automated notification from FitTrackr</p>
            <p>You're receiving this because you're an administrator</p>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to: adminEmail,
      subject: `[FitTrackr] New Feedback: ${feedback.subject}`,
      html,
    })
  }
}

export const emailService = new EmailService()

