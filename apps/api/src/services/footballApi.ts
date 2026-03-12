import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env")})

async function fetchMatches(){
    const response = await fetch("https://api.football-data.org/v4/competitions/PD/matches", {
    headers: {
        "X-Auth-Token": process.env.FOOTBALL_API_KEY!
    }
})
    const data = await response.json();
    return data
}
    

export default fetchMatches;