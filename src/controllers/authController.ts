import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';

import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import { emailQueue } from '../queues';

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

    await emailQueue.add('send-welcome-email', {
      user: {
        email: newUser.email,
        firstName: newUser.firstName,
      },
      type: 'welcome',
      subject,
      data: url,
    });

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
