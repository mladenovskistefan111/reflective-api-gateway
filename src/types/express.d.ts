// reflective-api-gateway/src/types/express.d.ts

// Type definitions to extend the Express Request object

declare namespace Express {
    export interface Request {
      // Add user property to Request object
      user?: {
        id: number;
        email: string;
        role: string;
        [key: string]: any; // Allows for additional properties if needed
      };
    }
  }