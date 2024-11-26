// types/express/index.d.ts
import { User as AppUser } from '../user.interface';

declare global {
  namespace Express {
    interface User extends AppUser {}

    interface Request {
      user?: {
        accessToken: string; 
        user:CreateUserDto
      };
        }
  }
}
