import express, { Request, Response } from "express";
import cors from "cors";
import payslipsRouter from "./routes/payslips";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/payslips", payslipsRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`MshaharaPro backend running on port ${PORT}`);
});
