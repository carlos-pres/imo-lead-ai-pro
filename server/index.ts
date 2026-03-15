import "dotenv/config";
import express from "express";
import cors from "cors";
import router from "./routes";
import { startScheduler } from "./services/schedulerService.js"

startScheduler()

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", router);

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "ImoLead AI Pro" });
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log("Server running on port", port);
});