import 'express';
import { ParsedQs } from 'qs'; // ✅ Import for type reference

// 1️⃣ Define a local interface you can import anywhere if needed
export interface AuthUser {
  id: string;
  role: string;
  email: string;
  firstName: string;
}

// 2️⃣ Extend Express.Request globally (merged with your existing + new validated)
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      validated?: {
        query: ParsedQs; // ✅ Adds type-safe access for parsed query in middleware
      };
    }
  }
}
