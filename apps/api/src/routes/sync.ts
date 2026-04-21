import { Router } from 'express';
import fetchMatches  from "../services/footballApi";
import prisma  from "../db";

const router = Router();

router.post('/', async (req, res) => {
    try{
        const matchData = await fetchMatches() as any;
        
        // API returns various matches in an array. Loop then goes through these records one by one
        for(let match of matchData.response){
            const homeTeamMatchData = await prisma.team.upsert({where: {name: match.teams.home.name}, update: {crest : match.teams.home.logo, externalId: match.teams.home.id}, create: {name: match.teams.home.name, crest: match.teams.home.logo, externalId: match.teams.home.id}});
            const awayTeamMatchData = await prisma.team.upsert({where: {name: match.teams.away.name}, update: {crest: match.teams.away.logo, externalId: match.teams.away.id}, create: {name: match.teams.away.name, crest: match.teams.away.logo, externalId: match.teams.away.id}});
        
            const createMatch = await prisma.match.create({data: {homeTeamId: homeTeamMatchData.id, awayTeamId: awayTeamMatchData.id, date: new Date(match.fixture.date), homeScore: match.goals.home, awayScore: match.goals.away}})
        }
        res.json({message: "Match creation complete"})
    }   
    catch(error){
        console.log(error);
        res.status(500).json({message : "Failed to sync matches"});
    }
});

export default router;