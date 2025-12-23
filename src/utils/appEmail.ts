import nodemailer from 'nodemailer';
import path from 'path';
import ejs from 'ejs';
import fs from 'fs';

interface User {
  email: string;
  firstName: string;
}

export class Email {
  private to: string;
  private firstName: string;
  private from: string;
  private subject: string;
  private data: Record<string, any>;

  constructor(user: User, data: Record<string, any>, subject: string) {
    this.to = user.email;
    this.firstName = user.firstName;
    this.data = data;
    this.subject = subject;
    this.from = `"My Shop" <${process.env.EMAIL_FROM || 'support@myshop.com'}>`;
  }

  /** Configure mail transport */
  private newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: 465,
        secure: true,
        auth: {
          user: process.env.MAIL_USERNAME,
          pass: process.env.MAIL_PASSWORD,
        },
      });
    }

    // Development / Local (e.g. Mailtrap)
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  /** Render EJS template */
  private async renderTemplate(
    templateName: string,
    data: Record<string, any>
  ) {
    // docker new location
    const templatePath = path.join(
      process.cwd(),
      'views',
      `${templateName}.ejs`
    );

    // const templatePath = path.join(__dirname, `../views/${templateName}.ejs`);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Email template '${templateName}.ejs' not found`);
    }

    return await ejs.renderFile(templatePath, data);
  }

  //  Send the email
  private async send(template: string) {
    const html = await this.renderTemplate(template, {
      firstName: this.firstName,
      data: this.data,
      subject: this.subject,
    });

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: this.subject,
      html,
    };

    await this.newTransport().sendMail(mailOptions);
  }

  // Send Welcome Email
  async sendWelcome() {
    await this.send('welcome');
  }

  //  Send Password Reset Email
  async sendPasswordReset() {
    await this.send('passwordReset');
  }

  //  Send Email Confirmation
  async sendConfirmEmail() {
    await this.send('confirmEmail');
  }

  // Send Order Email
  async sendOrderConfirmation() {
    await this.send('orderConfirmation');
  }

  // Send New Order Notification Email
  async sendNewOrderNotification() {
    await this.send('newOrder');
  }

  // Send Order Status Update Email
  async sendOrderStatusUpdate() {
    await this.send('orderStatus');
  }
}
