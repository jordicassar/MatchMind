import { Router } from "express"
import prisma  from "../db"

const router = Router();

// Fetches all predictions
router.get('/', async (req, res) =>{
    try{
        const prediction = await prisma.prediction.findMany({ include: { match: { include: { homeTeam: true, awayTeam: true } } } })
        res.json(prediction)
    }
    catch{
        res.status(500).json({message : "Failed to fetch predictions"});
    }
})

// Posts predictions
router.post('/', async (req, res) =>{
    try{
        // Extract matchID
        const { matchId } = req.body;

        // Uses matchID to query the DB 
        const match = await prisma.match.findUnique({where: {id: matchId}})

        // If match not found -> 404 
        if(!match){
            res.status(404).json({message: "Match not found"})
            return;
        }
        
        // Filter by homeTeam score != null
        const homeMatches = await prisma.match.findMany({where: {homeTeamId: match.homeTeamId, homeScore: {not: null}}, orderBy : { date: "desc"}})

        // Filter by awayTeam score != null
        const awayMatches = await prisma.match.findMany({where: {awayTeamId: match.awayTeamId, awayScore: {not: null}}, orderBy : { date: "desc"}})

        // Prediction Calculations for both Home & Away matches
        const homeTotal = homeMatches.reduce((sum, match, index) => sum + (match.homeScore ?? 0) * (homeMatches.length - index), 0)
        const awayTotal = awayMatches.reduce((sum, match, index) => sum + (match.awayScore ?? 0) * (awayMatches.length - index), 0)

        // Home & Away Weight Games
        const homeWeight = (homeMatches.length * (homeMatches.length + 1)) / 2;
        const awayWeight = (awayMatches.length * (awayMatches.length + 1)) / 2;

        // Calculations of predicted Home & Away Games
        const predictedHome = homeMatches.length > 0 ? Math.round(homeTotal / homeWeight) : 0;
        const predictedAway = awayMatches.length > 0 ? Math.round(awayTotal / awayWeight) : 0;

        // Extracts predictedHome, predictedAway & matchId for match Prediction
        const matchPrediction = await prisma.prediction.create({data:{predictedHome, predictedAway, matchId}})
        res.status(201).json(matchPrediction);


    }
    catch(error){
        res.status(500).json({message: "Unable to post predictions"})
    }
})

    // Fetches played match predictions
    router.get('/accuracy', async (req, res) =>{

    try{
        const playedMatches = await prisma.prediction.findMany({where: {match : {homeScore: {not: null}, awayScore: {not: null}}}, include: {match: true}});
        

        const correctPredictions = playedMatches.reduce((sum, prediction) => {
            let predictedResult = "";
            if (prediction.predictedHome > prediction.predictedAway){
                predictedResult = "home";
            }
            else if(prediction.predictedHome < prediction.predictedAway){
                predictedResult = "away";
            }
            else {
                predictedResult = "draw";
            }

            let actualResult = "";
            if ((prediction.match.homeScore ?? 0) > (prediction.match.awayScore ?? 0)){
                actualResult = "home";
            }
            else if((prediction.match.homeScore ?? 0) < (prediction.match.awayScore ?? 0)){
                actualResult = "away";
            }
            else{
                actualResult = "draw"
            }
            return predictedResult === actualResult ? sum + 1 : sum;
        }, 0)

        // Predicts the accuracy of the matches
        const accuracyPredictions = playedMatches.length > 0 ? (correctPredictions / playedMatches.length) * 100 : 0; 
        res.json({
            totalPredictions: playedMatches.length,
            correctPredictions,
            accuracy: accuracyPredictions
        })       
    }
    catch(error){
        res.status(500).json({message: "Unable to fetch prediction comparison."})
    }



})

export default router;