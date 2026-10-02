import app from '../backend/src/index';

// We WANT body parsing for JSON payloads!
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default app;
