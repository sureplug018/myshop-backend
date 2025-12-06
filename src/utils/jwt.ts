import jwt from 'jsonwebtoken';

export const signAccessToken = (
  userId: string,
  userRole: string,
  email: string,
  firstName: string
) => {
  return jwt.sign(
    { id: userId, role: userRole, email, firstName },
    process.env.ACCESS_TOKEN_SECRET!,
    {
      expiresIn: '5m',
    }
  );
};

export const signRefreshToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: '30d',
  });
};

export const verifyJwt = (token: string, secret: string) => {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    return null;
  }
};
