"use client";
import { useEffect, useState, use } from "react";
import "../../globals.css";
import Link from "next/link";

export default function TeamDetail({ params }: { params: Promise<{ id: string }> }) {
    const [team, setTeam] = useState<any>(null);
    const { id } = use(params);

    useEffect(()=>{
        async function fetchTeam(){
            const response = await fetch(`http://localhost:3001/api/teams/${id}`)
            const data = await response.json();
            setTeam(data);
        }
        fetchTeam()
    }, [id]);

    return (
        <div className="bg-gray-900 text-white min-h-screen p-8">
            <Link href="/" className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded">
                Back to Home
            </Link>
            {team && (
                <div className="flex flex-col items-center mt-8">
                    <img src={team.team.crest} alt={team.team.name} className="w-24 h-24 mb-4"/>
                    <h1 className="text-4xl font-bold text-white-400 mb-8">{team.team.name}</h1>
                    <div className="grid grid-cols-7 gap-6 text-center">

                        {/* Wins Section*/}
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <p className="text-2xl font-bold text-white-400">{team.stats.wins}</p>
                            <p className="text-gray-400">Wins</p>
                        </div>
                        {/* Losses Section */}
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <p className="text-2xl font-bold text-white-400">{team.stats.losses}</p>
                            <p className="text-gray-400">Losses</p>
                        </div>
                        {/* Draws Section */}
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <p className="text-2xl font-bold text-white-400">{team.stats.draws}</p>
                            <p className="text-gray-400">Draws</p>
                        </div>
                        {/* Upcoming Matches */}
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <p className="text-2xl font-bold text-white-400">{team.matches.filter((m: any) => m.homeScore === null).length}</p>
                            <p className="text-gray-400">Upcoming</p>
                        </div>
                        {/* Total Matches Section*/}
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <p className="text-2xl font-bold text-white-400">{team.stats.matchesPlayed}</p>
                            <p className="text-gray-400">Matches Played</p>
                        </div>
                        {/* Goals Scored Section*/}
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <p className="text-2xl font-bold text-white-400">{team.stats.goalsScored}</p>
                            <p className="text-gray-400">Goals Scored</p>
                        </div>
                        {/* Goals Conceded Section */}
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <p className="text-2xl font-bold text-white-400">{team.stats.goalsConceded}</p>
                            <p className="text-gray-400">Goals Conceded</p>
                        </div>

                    </div>
                    {/* Match History Section */}
                    <div className="mt-10">
                        <p className="text-4xl font-bold text-white text-center items-center">Upcoming Matches</p>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                            {team.matches.filter((match: any) => match.homeScore === null).map((match: any) => (
                                <div className="bg-gray-800 p-4 rounded-lg text-center hover:bg-gray-700 transition cursor-pointer" key={match.id}>
                                    <div className="flex items-center justify-center gap-4">
                                        <div className="flex flex-col items-center w-24">
                                            <img src={match.homeTeam.crest} alt={match.homeTeam.name} className="w-8 h-8" />
                                            <span className="text-xs mt-1 text-center break-words w-full min-h-[2.5rem]">{match.homeTeam.name}</span>
                                        </div>
                                        <span>vs</span>
                                        <div className="flex flex-col items-center w-24">
                                            <img src={match.awayTeam.crest} alt={match.awayTeam.name} className="w-8 h-8" />
                                            <span className="text-xs mt-1 text-center break-words w-full min-h-[2.5rem]">{match.awayTeam.name}</span>
                                        </div>
                                    </div>
                                    <p className={match.homeScore !== null ? "text-white-400 font-bold" : "text-gray-400"}>
                                        {match.homeScore !== null ? `${match.homeScore} - ${match.awayScore}` : "Upcoming"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Upcoming Match History */}
                    <div className="mt-10">
                        <p className="text-4xl font-bold text-white text-center items-center">Match History</p>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                            {team.matches.filter((match: any) => match.homeScore !== null).map((match: any) => (
                                <div className="bg-gray-800 p-4 rounded-lg text-center hover:bg-gray-700 transition cursor-pointer" key={match.id}>
                                    <div className="flex items-center justify-center gap-4">
                                        <div className="flex flex-col items-center w-24">
                                            <img src={match.homeTeam.crest} alt={match.homeTeam.name} className="w-8 h-8" />
                                            <span className="text-xs mt-1 text-center break-words w-full min-h-[2.5rem]">{match.homeTeam.name}</span>
                                        </div>
                                        <span>vs</span>
                                        <div className="flex flex-col items-center w-24">
                                            <img src={match.awayTeam.crest} alt={match.awayTeam.name} className="w-8 h-8" />
                                            <span className="text-xs mt-1 text-center break-words w-full min-h-[2.5rem]">{match.awayTeam.name}</span>
                                        </div>
                                    </div>
                                    <p className={match.homeScore !== null ? "text-white-400 font-bold" : "text-gray-400"}>
                                        {match.homeScore !== null ? `${match.homeScore} - ${match.awayScore}` : "Upcoming"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}