"use client";
import { useEffect, useState} from "react";
import "./globals.css";
import Link from "next/link";


export default function Home() {

  // Handles the Loading Process
  const [isLoading, setIsLoading]=useState<number | null>(null);
  // Handles the Team Selection Process
  const [selectedTeam, setSelectedTeam]=useState<number | null>(null);  
  // Fetch all teams from API when page loads
  const [teams, setTeams] = useState<any[]>([]);
  useEffect(() => {
    async function fetchTeams(){
      const response = await fetch("http://localhost:3001/api/teams");
      const data = await response.json();
      setTeams(data);
    }
    fetchTeams();
  }, []);

  // Fetch all matches from API when page loads
  const [matches, setMatches] = useState<any[]>([]);
  useEffect(()=>{
    async function fetchMatches(){
      const response = await fetch("http://localhost:3001/api/matches");
      const data = await response.json();
      setMatches(data);
    }
    fetchMatches();
  }, []);

  const filteredMatches = selectedTeam ? matches.filter((match) => match.homeTeamId === selectedTeam || match.awayTeamId === selectedTeam) : matches;


  // Stores & Sets predictions
  const [storePrediction, setStorePrediction] = useState<Record<number, any>>({});
  async function fetchPrediction(matchId: number){
    setIsLoading(matchId);
    const predictionResponse = await fetch("http://localhost:3001/api/predictions",{
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({matchId}),
    });
    const data = await predictionResponse.json();
    setStorePrediction(prev => ({ ...prev, [matchId]: data }));
    setIsLoading(null);
  }
    
  return (
    <div className="bg-gray-900 text-white min-h-screen p-8">
      <header className="text-6xl font-bold text-center mt-15 mb-10 font-poppins text-white">MatchMind</header>
      {/* Team Cards */}
      <header className="mt-30 text-6xl font-bold text-center mt-15 mb-10 font-poppins text-white-400">Teams</header>
      <div className="grid grid-cols-4 gap-4">
        {teams.map((team) => (
            <Link href={`/teams/${team.id}`} key={team.id}>
              <div className="bg-gray-800 p-6 rounded-lg text-center hover:bg-gray-700 transition cursor-pointer">
                <img src={team.crest} alt={team.name} className="w-12 h-12 mx-auto mb-2"/>
                <p>{team.name}</p>
              </div>
            </Link>
        ))}
      </div>

      <Link href="/accuracy" className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded float-right">View Accuracy</Link>

      <header className="text-6xl font-bold text-center mt-15 mb-10 font-poppins text-white-400">Matches</header>
      {/* Match Cards */}
      <div className="grid grid-cols-4 gap-4">
        {filteredMatches.map((match) => (
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
          {/* Prediction Button */}
            {match.homeScore === null && <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded mt-2" onClick={()=>fetchPrediction(match.id)}>
             {isLoading === match.id ? "Loading..." : "Get Prediction"}
            </button>}
          {/* Prediction appear if there is one for a certain match */}
          {storePrediction[match.id] && <p className="text-white-400 font-bold mt-1">{`${storePrediction[match.id].predictedHome} - ${storePrediction[match.id].predictedAway}`}</p>}
        </div>
      ))}
      </div>
      
    </div>
  );
}
