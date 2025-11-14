// Load environment variables from .env file for local development
import { config } from 'dotenv';

// Load environment variables from .env file in development
if (process.env.NODE_ENV !== 'production' && !process.env.REPL_ID) {
  config();
}
