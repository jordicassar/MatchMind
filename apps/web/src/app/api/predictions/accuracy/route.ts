// Prediction accuracy route — measures how well the model performs.
// Recomputes every played match's prediction from the current model (leak-free)
// and compares it to the actual result, so the number always reflects the live
// model — no stored predictions to regenerate. Powers the /accuracy page.
// The calculation lives in predictionAccuracy (lib/predictions.ts) so it can be
// unit-tested.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { predictionAccuracy } from "@/lib/predictions";

export async function GET() {
  try {
    const played = await prisma.match.findMany({
      where: { homeScore: { not: null }, awayScore: { not: null } },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(predictionAccuracy(played));
  } catch {
    return NextResponse.json({ message: "Failed to fetch accuracy" }, { status: 500 });
  }
}
