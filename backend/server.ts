import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import newsRoutes from "./routes/news";
import { Request, Response } from "express";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
    console.log("Hello World");
  res.send("Hello World");
});

app.use("/api/news", newsRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
