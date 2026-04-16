"use client";
import { useEffect, useState} from "react";
import "../globals.css"

export default function Accuracy(){
     const [accuracy, setAccuracy]=useState<any>(null);
     useEffect(()=>{
        async function fetchAccuracy(){
            const response = await fetch("http://localhost:3001/api/predictions/accuracy");
            const data = await response.json();
            setAccuracy(data);
        }
        fetchAccuracy();
    }, []);


    
    
    return(
        <div className="bg-gray-900 text-white min-h-screen p-8">
            <header className="text-6xl font-bold text-center mt-15 mb-10 font-poppins text-emerald-400">Accuracy</header>
            {accuracy && (
            <div>
                <p>{accuracy.totalPredictions}</p>
                <p>{accuracy.correctPredictions}</p>
                <p>{accuracy.accuracy}</p>
            </div>
            )}
        </div>
    )
}