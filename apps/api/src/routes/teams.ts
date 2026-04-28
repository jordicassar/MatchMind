import { Router } from 'express';
import prisma from '../db';

const router = Router();

// Gets teams
router.get('/', async (req, res) => {
    try{
        const teams = await prisma.team.findMany();
        res.json(teams);
    }
    catch(error){
        res.status(500).json({message : "Failed to fetch teams"});
    }

});

// Posts teams
router.post('/', async (req, res) => {
    try{
        const { name } = req.body;
        const team = await prisma.team.create({ data : {name}});
        res.status(201).json(team);
    }
    catch(error){
        res.status(500).json({message : "Unable to post teams"});
    }
    
});

// Gets team ID 
router.get('/:id', async (req, res) => {
    try{
        const id = parseInt(req.params.id);
        const team = await prisma.team.findUnique({ where: { id }});
        if(!team){
            res.status(404).json({message: "Team not found"});
            return;
        }
        const matches = await prisma.match.findMany({include: {homeTeam: true, awayTeam: true}, orderBy: {date:"desc"}, where: { OR : [{ homeTeamId: id}, {awayTeamId: id}]}})
        const homeMatches = await prisma.match.findMany({
            where: { homeTeamId: id, homeScore: {not: null}}
        });
        const awayMatches = await prisma.match.findMany({
            where: { awayTeamId: id, awayScore: {not: null}}
        });
        const wins = homeMatches.filter(m => (m.homeScore ?? 0) > (m.awayScore ?? 0)).length +
        awayMatches.filter(m => (m.awayScore ?? 0) > (m.homeScore ?? 0)).length;
        
        const losses = homeMatches.filter(m => (m.homeScore ?? 0) < (m.awayScore ?? 0)).length +
        awayMatches.filter(m => (m.awayScore ?? 0) < (m.homeScore ?? 0)).length;

        const draws = homeMatches.filter(m => m.homeScore !== null && m.awayScore !== null && m.homeScore === m.awayScore).length + awayMatches.filter(m => m.homeScore !== null && m.awayScore !== null && m.awayScore === m.homeScore).length;

        const goalsScored = homeMatches.reduce((sum, m) => sum + (m.homeScore ?? 0), 0) + awayMatches.reduce((sum, m) => sum + (m.awayScore ?? 0), 0);
        
        const goalsConceded = homeMatches.reduce((sum, m) => sum + (m.awayScore ?? 0), 0) + awayMatches.reduce((sum, m) => sum + (m.homeScore ?? 0), 0);

        const matchesPlayed = wins + draws + losses;

        res.status(200).json({team, stats: {
            wins, losses, draws, goalsScored, goalsConceded, matchesPlayed: wins + draws + losses
            }, matches
        });
    }
    catch(error){
        res.status(500).json({message: "Failed to fetch team"})
    }
})

export default router;
