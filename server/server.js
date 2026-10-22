import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";

const app = express();

// Middleware
app.use(
  cors({
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Start server
const PORT = process.env.PORT || 5000;

//test Routes
app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});