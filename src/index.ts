import express from "express";
import cors from "cors";
import fs from "fs";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

import { buildTree, extractNodesAndLinks, getDependencies } from "./utils";

// export default function depTrack() {
const _filename = fileURLToPath(
  require("url").pathToFileURL(__filename).toString()
);
const __dirname = dirname(_filename);

const app = express();
const port = 4000;

app.use(
  cors({
    origin: "http://localhost:5173",
    optionsSuccessStatus: 200,
  })
);

app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/track", (req, res) => {
  const sourceDir = (req.query.sourceDir as string) || "./test";
  const rootModule = (req.query.rootModule as string) || "test/App.ts";

  const dependencies = getDependencies(sourceDir);
  const dependencyTree = buildTree(dependencies, rootModule);
  const resultData = extractNodesAndLinks(dependencyTree);

  fs.writeFileSync(
    path.join(__dirname, "analysisResult.json"),
    JSON.stringify(resultData, null, 2)
  );

  res.json(resultData);
});

app.get("/result", (req, res) => {
  const filePath = path.join(__dirname, "analysisResult.json");

  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, "utf-8");
    res.json(JSON.parse(data));
  } else {
    res.status(404).json({ error: "No data available" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
// }
