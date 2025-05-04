import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { retrain } from './src/api/retrain.js';

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// API routes
app.post('/api/retrain', retrain);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 