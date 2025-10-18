import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import newsRoutes from "./routes/news";
import audioRoutes from './routes/audio'
import readNewsRouter from "./routes/readNews";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/audio', audioRoutes);
app.use("/api/news", newsRoutes);
app.use("/readnews", readNewsRouter);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));