import { schedule } from '@netlify/functions';

// Import the handler from the original function
import { handler as processMetadata } from './process-pending-metadata.js';

// Run every 30 minutes
export const handler = schedule('*/30 * * * *', processMetadata);
