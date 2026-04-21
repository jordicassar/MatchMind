import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env")})

async function fetchMatches(){
    const response = await fetch("https://v3.football.api-sports.io/fixtures?league=140&season=2024", {
        headers: {
            "x-apisports-key": process.env.FOOTBALL_API_KEY!
        }
    });
    const data = await response.json();
    return data;
}
    

export default fetchMatches;
