import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER;

let transporter: nodemailer.Transporter | null = null;

const createTransporter = () => {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('SMTP credentials not configured, email functionality disabled');
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

export const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    if (!transporter) {
      transporter = createTransporter();
    }

    if (!transporter) {
      console.error('Email transporter not configured');
      return false;
    }

    await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

export const sendVerificationEmail = async (email: string, token: string): Promise<boolean> => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/verify-email?token=${token}`;
  
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2>Verify Your Email Address</h2>
      <p>Thank you for registering with Teak Theory. Please verify your email address by clicking the button below:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" 
           style="background-color: #254127; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      
      <p>Or copy and paste this link in your browser:</p>
      <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
      
      <p>If you didn't create an account with us, you can safely ignore this email.</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #999; font-size: 12px;">This email was sent from Teak Theory</p>
    </div>
  `;

  return await sendEmail(email, 'Verify Your Email Address', html);
};

export const sendPasswordResetEmail = async (email: string, token: string): Promise<boolean> => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
  
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2>Reset Your Password</h2>
      <p>We received a request to reset your password for your Teak Theory account.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #254127; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
      
      <p>Or copy and paste this link in your browser:</p>
      <p style="color: #666; word-break: break-all;">${resetUrl}</p>
      
      <p>This link will expire in 1 hour for security reasons.</p>
      <p>If you didn't request a password reset, you can safely ignore this email.</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #999; font-size: 12px;">This email was sent from Teak Theory</p>
    </div>
  `;

  return await sendEmail(email, 'Reset Your Password', html);
};

// Manufacturing Stage Notification Email
export const sendStageUpdateEmail = async (
  customerEmail: string, 
  customerName: string,
  orderNumber: string,
  stageName: string,
  stageStatus: string,
  updateMessage?: string,
  imageUrl?: string
): Promise<boolean> => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
  const trackingUrl = `${baseUrl}/orders/tracking`;
  
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="background-color: #254127; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Teak Theory</h1>
        <p style="color: #a0c4a7; margin: 5px 0 0 0;">Manufacturing Update</p>
      </div>
      
      <div style="padding: 30px 20px;">
        <h2 style="color: #254127; margin-top: 0;">Hello ${customerName}!</h2>
        
        <p>We have an exciting update on your order <strong>#${orderNumber}</strong>!</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #254127; margin-top: 0;">
            📍 Stage: ${stageName}
          </h3>
          <p style="margin: 10px 0;">
            <strong>Status:</strong> 
            <span style="background-color: ${stageStatus === 'completed' ? '#d4edda' : '#fff3cd'}; 
                         color: ${stageStatus === 'completed' ? '#155724' : '#856404'}; 
                         padding: 4px 12px; border-radius: 4px; font-size: 14px;">
              ${stageStatus === 'completed' ? '✅ Completed' : '🔄 In Progress'}
            </span>
          </p>
          ${updateMessage ? `<p style="margin: 15px 0; font-style: italic;">"${updateMessage}"</p>` : ''}
        </div>
        
        ${imageUrl ? `
          <div style="text-align: center; margin: 20px 0;">
            <p style="margin-bottom: 10px;"><strong>Progress Photo:</strong></p>
            <img src="${imageUrl}" alt="Manufacturing Progress" 
                 style="max-width: 100%; height: auto; border-radius: 8px; border: 2px solid #e9ecef;" />
          </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${trackingUrl}" 
             style="background-color: #254127; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Full Progress
          </a>
        </div>
        
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;">
            <strong>💬 Have questions?</strong> You can communicate directly with your manufacturer through your order tracking page.
          </p>
        </div>
      </div>
      
      <hr style="margin: 30px 20px; border: none; border-top: 1px solid #eee;">
      <div style="padding: 0 20px 20px;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          This email was sent from Teak Theory regarding your order #${orderNumber}
        </p>
      </div>
    </div>
  `;

  return await sendEmail(customerEmail, `Manufacturing Update: ${stageName} - Order #${orderNumber}`, html);
};

export async function sendManufacturerNotificationEmail(
  manufacturerEmail: string,
  manufacturerName: string,
  orderNumber: string,
  message: string,
  type: 'customer_question' | 'stage_assigned'
): Promise<boolean> {
  const title = type === 'customer_question' 
    ? 'New Customer Question'
    : 'New Manufacturing Stage Assigned';
    
  const actionText = type === 'customer_question'
    ? 'Reply to Customer'
    : 'View Stage Details';

  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/manufacturer`;

  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #fff;">
      <div style="background-color: #254127; color: white; padding: 30px 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">🔔 ${title}</h1>
      </div>
      
      <div style="padding: 40px 20px;">
        <p style="margin: 0 0 20px 0; font-size: 16px;">
          Hi ${manufacturerName},
        </p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Order Number:</strong> ${orderNumber}</p>
          <p style="margin: 0;"><strong>Message:</strong> ${message}</p>
        </div>
        
        <p style="margin: 20px 0;">
          Please check your manufacturer dashboard to ${type === 'customer_question' ? 'respond to the customer' : 'view the stage details'}.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" 
             style="background-color: #254127; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            ${actionText}
          </a>
        </div>
      </div>
      
      <hr style="margin: 30px 20px; border: none; border-top: 1px solid #eee;">
      <div style="padding: 0 20px 20px;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          This email was sent from Teak Theory regarding order #${orderNumber}
        </p>
      </div>
    </div>
  `;

  return await sendEmail(manufacturerEmail, `${title} - Order #${orderNumber}`, html);
};