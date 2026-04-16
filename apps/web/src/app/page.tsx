"use client";
import { useEffect, useState} from "react";
import "./globals.css"


export default function Home() {

  // Handles the Loading Process
  const [isLoading, setIsLoading]=useState<number | null>(null);

  // Handles selectTeam
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  
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

  // Filters matches by team
  const filteredMatches = selectedTeam
  ? matches.filter(match => match.homeTeamId === selectedTeam || match.awayTeamId === selectedTeam)
  : matches;
    
  console.log(teams);
  return (
    <div className="bg-gray-900 text-white min-h-screen p-8">
      <header className="text-6xl font-bold text-center mt-15 mb-10 font-poppins text-emerald-400">MatchMind</header>
    
      {/* Team Cards */}
      <div className="grid grid-cols-4 gap-4">
        {teams.map((team)=>(<p className="bg-gray-800 p-6 rounded-lg text-center hover:bg-gray-700 transition cursor-pointer" key={team.id} onClick={() => setSelectedTeam(team.id)}>{team.name}</p>))}
      </div>

      {selectedTeam !== null && <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded mt-2" onClick={() =>{
        setSelectedTeam(null)
      }}>Show All</button>}
      <header className="text-6xl font-bold text-center mt-15 mb-10 font-poppins text-emerald-400">Matches</header>
    
      {/* Match Cards */}
      <div className="grid grid-cols-4 gap-4">
        {filteredMatches.map((match) => (
        <div className="bg-gray-800 p-4 rounded-lg text-center hover:bg-gray-700 transition cursor-pointer" key={match.id}>
          <p>{match.homeTeam.name} vs {match.awayTeam.name}</p>
          <p className={match.homeScore !== null ? "text-emerald-400 font-bold" : "text-gray-400"}>
            {match.homeScore !== null ? `${match.homeScore} - ${match.awayScore}` : "Upcoming"}
          </p>
          {/* Prediction Button */}
            {match.homeScore === null && <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded mt-2" onClick={()=>fetchPrediction(match.id)}>
             {isLoading === match.id ? "Loading..." : "Get Prediction"}
            </button>}
          {/* Prediction appear if there is one for a certain match */}
          {storePrediction[match.id] && <p className="text-emerald-400 font-bold mt-1">{`${storePrediction[match.id].predictedHome} - ${storePrediction[match.id].predictedAway}`}</p>}
        </div>
      ))}
      </div>
      
    </div>
  );
}
