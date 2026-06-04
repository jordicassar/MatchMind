// Accuracy page — displays how well MatchMind's predictions have performed.
// Fetches aggregated stats from /api/predictions/accuracy and renders them
// as a circular progress ring, a linear progress bar, and three stat cards.
// Shows an empty state if no predictions have been made yet.
"use client";
import { useEffect, useState } from "react";
import { Brain, CheckCircle2, Target } from "lucide-react";
import PageWrapper from "@/components/layout/PageWrapper";
import type { Accuracy as AccuracyData } from "@/lib/types";

export default function Accuracy() {
    // Holds the accuracy data returned from the API
    const [accuracy, setAccuracy] = useState<AccuracyData | null>(null);

    // Fetch accuracy stats once on mount
    useEffect(() => {
        fetch("/api/predictions/accuracy")
            .then((r) => r.json())
            .then(setAccuracy);
    }, []);

    // Only show stats if at least one prediction has been made
    const hasPredictions = accuracy && accuracy.totalPredictions > 0;

    // The API returns accuracy as a 0-100 percentage; round it for display
    const pct = accuracy ? Math.round(accuracy.accuracy) : 0;

    // SVG ring maths: circumference of a circle with r=54
    // dashOffset controls how much of the ring is filled
    const circumference = 2 * Math.PI * 54;
    const dashOffset    = circumference - (pct / 100) * circumference;

    return (
        <PageWrapper>
            <h1 className="mb-2 text-3xl font-bold text-foreground">Prediction Accuracy</h1>
            <p className="mb-10 text-sm text-muted-foreground">How well MatchMind predicts match outcomes.</p>

            {accuracy && hasPredictions ? (
                <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                    {/* Circular progress ring + progress bar */}
                    <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-10 lg:w-72 shrink-0">
                        <div className="relative h-36 w-36">
                            {/* SVG is rotated -90° so the ring starts at the top */}
                            <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                                {/* Background track */}
                                <circle
                                    cx="60" cy="60" r="54"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    className="text-border"
                                />
                                {/* Filled arc — length controlled by strokeDashoffset */}
                                <circle
                                    cx="60" cy="60" r="54"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={dashOffset}
                                    className="text-primary transition-all duration-700"
                                />
                            </svg>
                            {/* Percentage label centred inside the ring */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-extrabold text-foreground">{pct}%</span>
                                <span className="text-[11px] text-muted-foreground">Accuracy</span>
                            </div>
                        </div>

                        {/* Linear progress bar showing correct / total ratio */}
                        <div className="mt-6 w-full">
                            <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                                <span>{accuracy.correctPredictions} correct</span>
                                <span>{accuracy.totalPredictions} total</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                                <div
                                    className="h-full rounded-full bg-primary transition-all duration-700"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stat cards — one per key metric */}
                    <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1 lg:gap-4">
                        <StatCard
                            icon={Brain}
                            label="Total Predictions"
                            value={accuracy.totalPredictions}
                            description="Matches where a prediction was requested"
                            iconClass="text-chart-4"
                        />
                        <StatCard
                            icon={CheckCircle2}
                            label="Correct Predictions"
                            value={accuracy.correctPredictions}
                            description="Predicted score matched the actual result"
                            iconClass="text-chart-1"
                        />
                        <StatCard
                            icon={Target}
                            label="Accuracy Rate"
                            value={`${pct}%`}
                            description="Percentage of predictions that were correct"
                            iconClass="text-primary"
                            highlight
                        />
                    </div>
                </div>
            ) : (
                // Empty state — shown when no predictions have been made yet
                <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-24">
                    <Brain className="mb-4 h-12 w-12 text-muted-foreground/40" />
                    <p className="text-base font-medium text-foreground">No predictions yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Head to the home page and request a prediction to get started.
                    </p>
                </div>
            )}
        </PageWrapper>
    );
}

// Reusable stat card used for each key metric.
// The highlight prop gives the card a green tint — used for the accuracy rate.
function StatCard({
    icon: Icon,
    label,
    value,
    description,
    iconClass,
    highlight = false,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    description: string;
    iconClass: string;
    highlight?: boolean;
}) {
    return (
        <div className={`rounded-xl border p-5 ${highlight ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
            <div className="mb-3 flex items-center gap-2">
                <Icon className={`h-5 w-5 ${iconClass}`} />
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
            </div>
            <p className={`text-4xl font-extrabold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
    );
}