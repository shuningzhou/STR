import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
    this.from = this.config.get<string>('EMAIL_FROM') ?? 'STR <signal@opticanvas.com>';
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    await this.resend.emails.send({
      from: this.from,
      to: [email],
      subject: 'Verify your email - STR',
      html: `
        <p>Your verification code is: <strong>${code}</strong></p>
        <p>This code expires in 10 minutes.</p>
      `,
    });
  }

  async sendOtpCode(email: string, code: string): Promise<void> {
    await this.resend.emails.send({
      from: this.from,
      to: [email],
      subject: 'Your sign-in code - STR',
      html: `
        <p>Your sign-in code is: <strong>${code}</strong></p>
        <p>This code expires in 10 minutes.</p>
      `,
    });
  }
}
