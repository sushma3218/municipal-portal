import { verifyToken } from './auth';

export function getUserFromRequest(req: Request): any {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  return verifyToken(token);
}
