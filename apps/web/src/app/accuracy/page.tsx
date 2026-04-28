"use client";
import { useEffect, useState} from "react";
import "../globals.css";
import Link from "next/link";

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
            <Link href="/" className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded">
                Back to Home
            </Link>
            {accuracy && accuracy.totalPredictions > 0 ?(
            <div>
                <p>{accuracy.totalPredictions}</p>
                <p>{accuracy.correctPredictions}</p>
                <p>{accuracy.accuracy}</p>
            </div>
            ) : (
                <p className="text-center text-gray-400">No predictions made yet. Come back soon!</p>
            )}
        </div>
    )
}