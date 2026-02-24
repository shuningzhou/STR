import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from './schemas/user.schema';
import { MailService } from './mail.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyDto } from './dto/verify.dto';

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() }).lean().exec();
    if (existing) {
      throw new BadRequestException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const otpCode = generateOtp();
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await this.userModel.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      emailVerified: false,
      otpCode,
      otpExpiresAt,
    });

    await this.mailService.sendVerificationCode(dto.email.toLowerCase(), otpCode);

    return { message: 'Verification code sent to your email' };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }> {
    const user = await this.userModel.findOne({ email: dto.email.toLowerCase() }).exec();
    if (!user) throw new UnauthorizedException('Invalid email or code');
    if (user.emailVerified) throw new BadRequestException('Email already verified');
    if (!user.otpCode || !user.otpExpiresAt) throw new UnauthorizedException('Invalid email or code');
    if (user.otpExpiresAt < new Date()) throw new UnauthorizedException('Code expired');
    if (user.otpCode !== dto.code) throw new UnauthorizedException('Invalid email or code');

    user.emailVerified = true;
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    return { message: 'Email verified' };
  }

  async login(dto: LoginDto): Promise<{ requiresOtp: true }> {
    const user = await this.userModel.findOne({ email: dto.email.toLowerCase() }).lean().exec();
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const match = await bcrypt.compare(dto.password, user.passwordHash);
    if (!match) throw new UnauthorizedException('Invalid email or password');

    if (!user.emailVerified) throw new BadRequestException('Please verify your email first');

    const otpCode = generateOtp();
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await this.userModel.updateOne(
      { _id: user._id },
      { $set: { otpCode, otpExpiresAt } },
    ).exec();

    await this.mailService.sendOtpCode(dto.email.toLowerCase(), otpCode);

    return { requiresOtp: true };
  }

  async verify(dto: VerifyDto): Promise<{ accessToken: string }> {
    const user = await this.userModel.findOne({ email: dto.email.toLowerCase() }).lean().exec();
    if (!user) throw new UnauthorizedException('Invalid email or code');
    if (!user.otpCode || !user.otpExpiresAt) throw new UnauthorizedException('Invalid email or code');
    if (user.otpExpiresAt < new Date()) throw new UnauthorizedException('Code expired');
    if (user.otpCode !== dto.code) throw new UnauthorizedException('Invalid email or code');

    await this.userModel.updateOne(
      { _id: user._id },
      { $unset: { otpCode: 1, otpExpiresAt: 1 } },
    ).exec();

    const payload = { sub: user._id.toString(), email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }
}
