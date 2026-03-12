import Express from "express";
import cors from "cors";
import prisma from "./db";
import teamRoutes from "./routes/teams";
import matchRoutes from "./routes/matches";
import predictionRoutes from "./routes/predictions";
import syncRoutes from "./routes/sync";

const app = Express();

app.use(cors());
app.use(Express.json());
app.use("/api/teams", teamRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/sync", syncRoutes);

app.get("/health", async (req, res) => {
  try {
    const teamCount = await prisma.team.count();
    res.status(200).json({ status: "ok", teams: teamCount });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Database connection failed" });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});