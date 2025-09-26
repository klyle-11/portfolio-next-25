import React, { useState, useRef, useEffect } from 'react';
import useInterval from '@use-it/interval';
let minutes, seconds;

function TimerInterface(props) {
    const timer = useRef(props.time);

    const [ play, setPlay ] = useState(false);
    const [ stop, setStop ] = useState(true);
    const [ pause, setPause ] = useState(false);
    const [ delay, setDelay ] = useState(null);

    useEffect(() => {
        timer.current = props.time;
    }, [props.time])

    useInterval(() => {
        minutes = parseInt(timer.current / 60, 10);
        seconds = parseInt(timer.current % 60, 10);

        minutes = minutes.toString().length === 1 ? `0${minutes}` : `${minutes}`;
        seconds = seconds.toString().length === 1 ? `0${seconds}` : `${seconds}`;

        console.log(`${minutes}:${seconds}`);

        if (timer.current < 0) {
            timer.current = props.time;
        }

        timer.current--;

        props.changeTimeDisplay(`${minutes}:${seconds}`);

    }, delay);

    const handlePlay = () => {
        if (!pause) {
            timer.current = props.time;
        }
        setPause(false);
        setPlay(true);
        setStop(false);
        setDelay(1000); 
        props.isRunning(true);
    }

    const handlePause = () => {
        setPlay(false);
        setStop(false);
        setPause(true);
        setDelay(null);
        props.isRunning(false);
    }

    const handleStop = () => {
        setPlay(false);
        setPause(false);
        setStop(true);
        setDelay(null);
        timer.current = props.time;
        props.changeTimeDisplay(`${ props.time / 60 }:00`);
        props.isRunning(false);
    }

    if (stop) {
        return(
            <div id='sessioncontrols'>
                <img className='sessioncontrol' src='/img/play.png' alt='play button' onClick={handlePlay} />
                <img className='sessioncontrol' src='/img/stopfalse.svg' alt='stop button' />
            </div>

            
        );
    } else if (play) {
        return(
            <div id='sessioncontrols'>
                <img className='sessioncontrol' src='/img/pause.png' alt='pause button' onClick={handlePause} />
                <img className='sessioncontrol' src='/img/stop.png' alt='stop button' onClick={handleStop} />
            </div>  
        );
    } else {
        return(
            <div id='sessioncontrols'>
                <img className='sessioncontrol' src='/img/play.png' alt='play button' onClick={handlePlay} />
                <img className='sessioncontrol' src='/img/stop.png' alt='stop button' onClick={handleStop} />
            </div>
        );
    }

}

export default TimerInterface;