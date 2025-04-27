// lib/jwt.ts
import jwt from 'jsonwebtoken';
const SECRET = process.env.JWT_SECRET!;

export function verifyJwt(token: string): string {
  try {
    const { id } = jwt.verify(token, SECRET) as { id: string };
    return id;
  } catch {
    throw new Error('Invalid token');
  }
}