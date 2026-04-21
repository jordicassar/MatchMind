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
        const team = await prisma.team.findUnique({where: { id }});

        // Error handling if a team isn't found
        if(!team){
            res.status(404).json({ mesage: "Team not found"});
            return;
        }

        // API Endpoint 
        const response = await fetch(`https://api.football-data.org/v4/teams/${team.externalId}`, { headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY ?? ""}});
        const data = await response.json();
        res.json(data);

    }
    catch(error){
        res.status(500).json({message: "Failed to fetch team IDs"});
    }
})

export default router;
