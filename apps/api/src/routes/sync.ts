import { Router } from 'express';
import fetchMatches  from "../services/footballApi";
import prisma  from "../db";

const router = Router();

router.post('/', async (req, res) => {
    try{
        const matchData = await fetchMatches() as any;
        
        // API returns various matches in an array. Loop then goes through these records one by one
        for(let match of matchData.matches){
            const homeTeamMatchData = await prisma.team.upsert({where: {name: match.homeTeam.name}, update: {}, create: {name: match.homeTeam.name}});
            const awayTeamMatchData = await prisma.team.upsert({where: {name: match.awayTeam.name}, update: {}, create: {name: match.awayTeam.name}});
        
            const createMatch = await prisma.match.create({data: {homeTeamId: homeTeamMatchData.id, awayTeamId: awayTeamMatchData.id, date: new Date(match.utcDate), homeScore: match.score.fullTime.home, awayScore: match.score.fullTime.away}})
        }
        res.json({message: "Match creation complete"})
    }   
    catch(error){
        res.status(500).json({message : "Failed to sync matches"});
    }
});

export default router;