import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 8000);
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ extended: true, limit: "40kb" }));

app.use("/api/v1/user", userRoutes);

const start = async () => {
  const connectionDB = await mongoose.connect(
    "mongodb+srv://avinashikigai:Chaman1011@cluster0.prdjiv8.mongodb.net/mydatabase?retryWrites=true&w=majority"
  );
  console.log(`MongoDB connected on Host: ${connectionDB.connection.host}`);
  server.listen(app.get("port"), () => {
    console.log("Server is running on port 8000");
  });
};
start();
