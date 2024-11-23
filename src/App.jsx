// module
import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label, Bar } from 'recharts';

//style
import './App.css';

//asset
import { tempColors } from "./library/TempColors.js";
import leftArrowIcon from "./assets/left-arrow.png";
import rightArrowIcon from "./assets/right-arrow.png";

//page
import Debug from './tools/Debug';

// const
const debug = false;

export default function App() {
  // state
  const [doorStatus, setDoorStatus] = useState(null);
  const [tempInside, setTempInside] = useState(0);
  const [tempOutside, setTempOutside] = useState(0);
  const [date, setDate] = useState(null);
  const [tempData, setTempData] = useState([]);
  const [tempDataScope, setTempDataScope] = useState(0);
  const [tempDataCurrentDayScope, setTempDataCurrentDayScope] = useState([]);

  // useEffect
  useEffect(() => {
    const div = document.getElementById('no-scroll');
    let isPressing = false;

    div.addEventListener('touchstart', (e) => {
      isPressing = true;
      e.preventDefault();
    });

    div.addEventListener('touchend', () => {
      isPressing = false;
    });

    document.addEventListener('touchmove', (e) => {
      if (isPressing) {
        e.preventDefault();
      }
    }, { passive: false });

    axios.get(import.meta.env.VITE_API_URL)
      .then((res) => {
        setDoorStatus(res.data.doorStatus);
        setTemp(tempInside, setTempInside, res.data.tempInside);
        setTemp(tempOutside, setTempOutside, res.data.tempOutside);
        setDate(new Date(res.data.date));
        setTempData(res.data.tempData.data);
        setTempDataScope(res.data.tempData.data.length - 24);
        setTempDataCurrentDayScope(res.data.tempData.data[res.data.tempData.data.length - 1].time.split('T')[0] || "");
      }).catch(error => {
        console.log(error);
      });
  }, []);

  useEffect(() => {
    if (Object.prototype.toString.call(date) === '[object Date]') {
      const timer = setInterval(() => {
        setDate((prevDate) => {
          let newDate = new Date(prevDate);
          newDate.setUTCSeconds(newDate.getUTCSeconds() + 1);
          return newDate;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [date]);

  useEffect(() => {
    const tempElement = document.getElementById('temp_inside');
    const colorId = tempInside < 0 ? Math.ceil(tempInside) + 20 : Math.floor(tempInside) + 20;
    tempElement.style.color = tempColors[colorId];
  }, [tempInside]);

  useEffect(() => {
    const tempElement = document.getElementById('temp_outside');
    const colorId = tempOutside < 0 ? Math.ceil(tempOutside) + 20 : Math.floor(tempOutside) + 20;
    tempElement.style.color = tempColors[colorId];
  }, [tempOutside]);

  // function
  function setTemp(state, setState, goal) {
    let count = state;
    const interval = setInterval(() => {
      count += goal / 20;
      setState(count);
    }, 30)
    setTimeout(() => {
      clearInterval(interval)
      setState(Number(goal));
    }, 600)
  }

  function formatDate(date) {
    let year = date.getUTCFullYear();
    let month = String(date.getUTCMonth() + 1).padStart(2, '0');
    let day = String(date.getUTCDate()).padStart(2, '0');

    let hours = String(date.getUTCHours()).padStart(2, '0');
    let minutes = String(date.getUTCMinutes()).padStart(2, '0');
    let seconds = String(date.getUTCSeconds()).padStart(2, '0');

    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  }

  function adjustDate(shouldIncrement) {
    if (tempDataCurrentDayScope === "") return;
    let date = new Date(tempDataCurrentDayScope);
    date.setDate(date.getDate() + (shouldIncrement ? 1 : -1));
    const adjustedDate = date.toISOString().split('T')[0];
    searchDay(adjustedDate);
  }

  function searchDay(day) {
    if (day === "") return;
    setTempDataCurrentDayScope(day);
    const newScope = tempData.findIndex(entry => entry.time.split('T')[0] === day);
    if (newScope === -1) return setTempDataScope(newScope);
    if (newScope > tempData.length - 25) return setTempDataScope(tempData.length - 24);
    setTempDataScope(newScope);
  }

  function calculYAxis(calculAll) {
    let calculMin = Math.floor(Math.min(...(tempData.slice(tempDataScope, tempDataScope + 24).map(element => element.ext).concat(tempData.slice(tempDataScope, tempDataScope + 24).map(element => element.int)))) - 0.2);
    const calculMax = Math.ceil(Math.max(...(tempData.slice(tempDataScope, tempDataScope + 24).map(element => element.ext).concat(tempData.slice(tempDataScope, tempDataScope + 24).map(element => element.int)))) + 0.2);
    if (calculMin >= 0) calculMin = 0;
    if (calculAll) {
      let resultat = [calculMin];
      for (let i = calculMin + 1; i < calculMax; i++) {
        if (i % 2 === 0) resultat.push(i);
      }
      resultat.push(calculMax);
      return resultat;
    }
    return [calculMin, calculMax]
  }

  return (
    <>
      {debug && <Debug setTemp={setTemp} tempInside={tempInside} setTempInside={setTempInside} tempOutside={tempOutside} setTempOutside={setTempOutside} />}
      <div className='door_div'>
        <p className='title'>Porte</p>
        <h1>
          {doorStatus ? "OUVERTE" : doorStatus === false ? "FERMÉE" : "null"}
        </h1>
      </div>
      <div className='temp_div'>
        <div>
          <p className='title'>Temp. Int</p>
          <h1 id='temp_inside'>
            {tempInside.toFixed(2)}°
          </h1>
        </div>
        <div>
          <p className='title'>Temp. Ext</p>
          <h1 id='temp_outside'>
            {tempOutside.toFixed(2)}°
          </h1>
        </div>
      </div>
      <div className='vid_div'>
        <p className='title'>Temp. Ext</p>
        <img src={import.meta.env.VITE_VIDEO_URL} alt="Flux vidéo en direct" />
      </div>
      <div className='chart_div'>
        <p className='title'>Historique</p>
        <div className="chart-container">
          <ResponsiveContainer id="no-scroll">
            <LineChart data={tempData ? tempData.slice(tempDataScope, tempDataScope + 24) : []} margin={{ top: 30, right: 30, left: -20, bottom: 65 }} >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tickFormatter={(e) => e.slice(11, 13) + "h"} />
              <YAxis domain={calculYAxis} ticks={tempData.length > 0 ? calculYAxis(true) : []} />
              <Tooltip labelFormatter={(e) => e.slice(0, 10).replaceAll("-", "/") + " " + e.slice(11, 13) + "h"} />
              <Legend width={"100%"} wrapperStyle={{ paddingLeft: "20px" }} formatter={(e) => e === "ext" ? "Extérieur" : "Intérieur"} />
              <Line type="monotone" dataKey="ext" stroke="#8884d8" strokeWidth="1.5" dot={false} />
              <Line type="monotone" dataKey="int" stroke="#82ca9d" strokeWidth="1.5" strokeDasharray="5 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="chart-buttons">
            <button onClick={() => adjustDate(false)}><img src={leftArrowIcon} alt="Left arrow" /></button>
            <input type="date" value={tempDataCurrentDayScope} onChange={(e) => searchDay(e.target.value)} />
            <button onClick={() => adjustDate(true)} ><img src={rightArrowIcon} alt="Left arrow" /></button>
          </div>
        </div>
      </div>
      <p className='time_div'>Heure serveur : {date !== null && formatDate(date)}</p>
    </>
  )
}