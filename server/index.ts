import "dotenv/config";
import cors from "cors";
import express from "express";
import { router } from "./routes";

const app = express();

app.disable("x-powered-by");
app.use(cors());
app.use(express.json());

app.use("/", router);

app.get("/", (_req, res) => {
  res.json({
    name: "ImoLead AI Pro API",
    status: "ok",
    version: "v1",
  });
});

const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`ImoLead AI Pro API listening on http://${HOST}:${PORT}`);
});
