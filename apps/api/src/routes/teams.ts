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
    
})

export default router;
