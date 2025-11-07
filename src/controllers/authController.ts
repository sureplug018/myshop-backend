import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';

import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import { emailQueue } from '../queues';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import { generateResetToken } from '../utils/generateHash';
import { Email } from '../utils/appEmail';

const prisma = new PrismaClient();

interface SignUpRequest extends Request {
  body: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
    passwordConfirm: string;
  };
}

export const signUp = catchAsync(
  async (req: SignUpRequest, res: Response, next: NextFunction) => {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      passwordConfirm,
    } = req.body;

    // Basic validation1
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phoneNumber ||
      !password ||
      !passwordConfirm
    ) {
      return next(new AppError('All fields are required', 400));
    }

    if (password !== passwordConfirm) {
      return next(new AppError('Passwords do not match', 400));
    }

    // Check for existing user
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { email: true },
    });

    if (existingUser) {
      return next(new AppError('Email is already registered', 400));
    }

    // salt password
    const hashedPassword = await bcrypt.hash(password, 12);

    // create new user
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phoneNumber,
        password: hashedPassword,
      },
    });

    const subject = 'Welcome To MyShop';
    const url = { link: `${req.protocol}://${req.get('host')}` };

    // offloading the process to a queue
    await emailQueue.add('send-welcome-email', {
      user: {
        email: newUser.email,
        firstName: newUser.firstName,
      },
      type: 'welcome',
      subject,
      data: url,
    });

    // sending email without queuing
    // await new Email(newUser, url, subject).sendWelcome();

    // Respond
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: newUser,
      },
    });
  }
);

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

export const signin = catchAsync(
  async (req: LoginRequest, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password)
      return next(new AppError('Please provide email and password', 400));

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        email: true,
        password: true,
        role: true,
        id: true,
      },
    });

    if (
      !user ||
      // user.role !== 'user' || admins can use the same endpoint, but redirect to dashboard based on the role on the response
      !(await bcrypt.compare(password, user.password))
    )
      return next(new AppError('Incorrect email or password', 401));

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    // Set cookies
    const accessCookieOptions = {
      secure: true,
      httpOnly: true,
      path: '/',
      sameSite: 'none' as const,
      maxAge: 15 * 60 * 1000, //15 mins
    };

    const refreshCookieOptions = {
      secure: true,
      httpOnly: true,
      path: '/',
      sameSite: 'none' as const,
      maxAge: 30 * 24 * 60 * 60 * 1000, //30 days
    };

    res.cookie('access-token', accessToken, accessCookieOptions);
    res.cookie('refresh-token', refreshToken, refreshCookieOptions);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        userAgent: req.get('user-agent'),
        ipAddress: req.ip,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(200).json({
      status: 'success',
      accessToken,
      refreshToken,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    });
  }
);

interface forgotPasswordRequest extends Request {
  body: {
    email: string;
  };
}

export const forgotPassword = catchAsync(
  async (req: forgotPasswordRequest, res: Response, next: NextFunction) => {
    const { email } = req.body;

    if (!email)
      return next(new AppError('Please enter your email address', 400));

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return next(new AppError('Invalid email address', 401));

    // generate reset token and save the reset token to db and time frame of 10 mins
    const resetToken = await generateResetToken(user.id);

    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/reset-password/${resetToken}`;

    const subject = 'Your password reset token (valid for only 10 minutes)';

    // offload sending email to queue with priority: 1
    await emailQueue.add(
      'send-reset-password-email',
      {
        user: {
          email: user.email,
          firstName: user.firstName,
        },
        type: 'passwordReset',
        subject,
        data: resetUrl,
      },
      {
        priority: 1,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'Reset token sent successfully successfully',
      data: {
        token: resetToken,
      },
    });
  }
);
