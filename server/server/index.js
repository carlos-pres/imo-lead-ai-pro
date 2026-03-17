import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("OK 🚀 SERVIDOR ONLINE");
});

app.get("/api/test", (req, res) => {
  res.json({ status: "API funcionando" });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});