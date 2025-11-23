import 'express';

// 1️⃣ Define a local interface you can import anywhere if needed
export interface AuthUser {
  id: string;
  role: string;
}

// 2️⃣ Extend Express.Request globally
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
