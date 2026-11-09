"use client";
import { useEffect, useState } from "react";
import { Brain, CheckCircle2, Crosshair, Target } from "lucide-react";
import PageWrapper from "@/components/layout/PageWrapper";
import type { Accuracy as AccuracyData } from "@/lib/types";

export default function Accuracy() {
    const [accuracy, setAccuracy] = useState<AccuracyData | null>(null);

    useEffect(() => {
        fetch("/api/predictions/accuracy")
            .then((r) => r.json())
            .then(setAccuracy);
    }, []);

    const hasPredictions = accuracy && accuracy.totalPredictions > 0;

    const pct = accuracy ? Math.round(accuracy.accuracy) : 0;

    const circumference = 2 * Math.PI * 54;
    const dashOffset    = circumference - (pct / 100) * circumference;

    return (
        <PageWrapper>
            <h1 className="mb-2 text-3xl font-bold text-foreground">Prediction Accuracy</h1>
            <p className="mb-10 text-sm text-muted-foreground">
                How well MatchMind predicts {accuracy?.season ?? "this season's"} match outcomes.
                {accuracy?.backtest && accuracy.backtest.totalPredictions > 0 && (
                    <> Backtested on {accuracy.backtest.season}: {Math.round(accuracy.backtest.accuracy * 10) / 10}% ({accuracy.backtest.correctPredictions} of {accuracy.backtest.totalPredictions}).</>
                )}
            </p>

            {accuracy && hasPredictions ? (
                <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                    <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-10 lg:w-72 shrink-0">
                        <div className="relative h-36 w-36">
                            <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                                <circle
                                    cx="60" cy="60" r="54"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    className="text-border"
                                />
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
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-extrabold text-foreground">{pct}%</span>
                                <span className="text-[11px] text-muted-foreground">Accuracy</span>
                            </div>
                        </div>

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

                    <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:gap-4">
                        <StatCard
                            icon={Brain}
                            label="Total Predictions"
                            value={accuracy.totalPredictions}
                            description="Played matches this season, each predicted before kick-off"
                            iconClass="text-chart-4"
                        />
                        <StatCard
                            icon={CheckCircle2}
                            label="Correct Predictions"
                            value={accuracy.correctPredictions}
                            description="Predicted the right outcome — home win, draw or away win"
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
                        <StatCard
                            icon={Crosshair}
                            label="Exact Scores"
                            value={`${Math.round(accuracy.exactScoreAccuracy)}%`}
                            description={`Exact scoreline right in ${accuracy.exactScores} of ${accuracy.totalPredictions} matches — a much stricter test`}
                            iconClass="text-chart-3"
                        />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-24">
                    <Brain className="mb-4 h-12 w-12 text-muted-foreground/40" />
                    <p className="text-base font-medium text-foreground">No results yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Accuracy appears once this season&apos;s first matches have been played.
                    </p>
                </div>
            )}
        </PageWrapper>
    );
}

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