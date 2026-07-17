import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import notionIndexRoutes from './routes/notionIndexRoutes';
import statsRoutes from './routes/statsRoutes';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});
//testing
app.use('/auth', authRoutes);
app.use('/notion', notionIndexRoutes);
app.use('/stats', statsRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});