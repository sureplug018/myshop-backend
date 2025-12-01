// middleware/protect.ts
import { PrismaClient } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { verifyJwt, signAccessToken } from '../utils/jwt';
import { AppError } from '../utils/appError';

const prisma = new PrismaClient();

export const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. Get tokens
    const accessToken = req.cookies['access-token'];
    const refreshToken = req.cookies['refresh-token'];

    if (!accessToken && !refreshToken) {
      return next(new AppError('You are not logged in', 401));
    }

    // 2. Verify access token
    const decodedAccess = verifyJwt(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET!
    );
    if (decodedAccess) {
      // Access token is valid → attach user
      req.user = decodedAccess as any;
      return next();
    }

    // 3. Access token expired → try refresh token
    if (!refreshToken) {
      return next(new AppError('Session expired. Please log in again.', 401));
    }

    const decodedRefresh = verifyJwt(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    );
    if (!decodedRefresh) {
      // Refresh token invalid or expired
      await logoutUser(res, refreshToken);
      return next(new AppError('Session expired. Please log in again.', 401));
    }

    // 4. Find refresh token in DB
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      await logoutUser(res, refreshToken);
      return next(new AppError('Session expired. Please log in again.', 401));
    }

    // 5. Optional: Check device fingerprint (userAgent + ip)
    const currentAgent = req.get('user-agent') || '';
    const currentIp = req.ip || '';
    if (
      storedToken.userAgent !== currentAgent ||
      storedToken.ipAddress !== currentIp
    ) {
      await logoutUser(res, refreshToken);
      return next(
        new AppError('Session compromised. Logged out from this device.', 401)
      );
    }

    // 6. Issue new access token
    const newAccessToken = signAccessToken(
      storedToken.user.id,
      storedToken.user.role
    );

    // Set new access cookie
    res.cookie('access-token', newAccessToken, {
      secure: true,
      httpOnly: true,
      path: '/',
      sameSite: 'none',
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    // Attach user to request
    req.user = {
      id: storedToken.user.id,
      role: storedToken.user.role,
    };

    next();
  }
);

// Helper: Logout + cleanup
const logoutUser = async (res: Response, refreshToken: string) => {
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  res.clearCookie('access-token', {
    path: '/',
    sameSite: 'none',
    secure: true,
  });
  res.clearCookie('refresh-token', {
    path: '/',
    sameSite: 'none',
    secure: true,
  });
};
