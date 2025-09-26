import React, {useState} from 'react';
import TimerInterface from './Timer';
import TimeDisplay from './TimeDisplay';
import SessionInput from './SessionInput';
// import WorkJournal from './WorkJournal';
import styles from './Card.module.scss';

function Card() {
    const [ sessionTime, setSessionTime ] = useState(1500);
    const [ timeDisplay, setDisplay ] = useState(`${sessionTime/60}:00`);
    const [ isRunning, setIsRunning ] = useState(false);

    const changeSessionTime = (session) => {
        setIsRunning(false);
        isRunning ? alert('Stop it first!') :
            session = parseInt(session);
            setSessionTime(session * 60);
            console.log(setSessionTime(session * 60))
            console.log(sessionTime + typeof(sessionTime));
            setDisplay(`${session}:00`);
    }

    const isPlaying = (boolean) => {
        setIsRunning(boolean);
    }

    const changeTimeDisplay = (display) => {
        setDisplay(display);
    }
    

    return(
        <div className={styles.card}>
            < TimeDisplay display={timeDisplay} />
            < TimerInterface 
                time={sessionTime} 
                changeTimeDisplay={changeTimeDisplay} 
                isRunning={isPlaying}
            />
            < SessionInput changeSessionTime={changeSessionTime} />
            {/* < WorkJournal />  */}
        </div>
    );
}

export default Card;


