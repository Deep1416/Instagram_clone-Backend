import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import messageRoutes from "./routes/message.route.js";
import { app,server } from "./socket/socket.js";
dotenv.config({});
// const app = express();
// CORS configuration
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({ extended: true }));

// Define routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/post", postRoutes);
app.use("/api/v1/message", messageRoutes);

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  connectDB();
  console.log(`Server is up and running at http://localhost:${PORT} 🚀`);
});
