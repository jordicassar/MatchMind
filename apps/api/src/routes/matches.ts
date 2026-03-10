import { Router } from 'express';
import prisma from '../db';

const router = Router();

// Gets matches
router.get('/', async (req, res) =>{
    try{
        const match = await prisma.match.findMany({include : {homeTeam:true, awayTeam:true}, orderBy : { date: "desc"}});
        res.json(match);
    }
    catch{
        res.status(500).json({message : "Failed to fetch matches"});
    }
});

// Updates predictions
router.put('/:id', async (req, res) => {
    try{
        // Extract matchID
        const { id }  = req.params;

        const {homeScore, awayScore} = req.body;

        const updateMatch = await prisma.match.update({where: {id: Number(id)}, data: {homeScore, awayScore}});
        res.json(updateMatch);

    }
    catch{
        res.status(500).json({message : "Failed to update predictions"});
    }
})

// Posts matches
router.post('/', async (req, res) =>{
    try{
        const { homeTeamId, awayTeamId, date, homeScore, awayScore} = req.body;
        const newMatch = await prisma.match.create({data : {homeTeamId, awayTeamId, date: new Date(date), homeScore, awayScore }})
        res.status(201).json(newMatch);
    }
    catch(error){
        res.status(500).json({message : "Unable to post teams"});
    }
})


export default router;