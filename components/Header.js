import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Header.module.scss';
import { StaticRouter as Router, Route, Switch} from 'react-router-dom';

// export const getStaticProps = async () => {
//     const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Philadelphia&units=imperial&appid=${process.env.WEATHER_KEY}`);

//     return {
//         props: {
//             url: `https://openweathermap.org/img/w/${res.data.weather[0].icon}.png`,
//             temp: parseInt(res.data.main.temp),
//             hello: 'hello'
//         },
//     }
// }

export default function Header() {
    // console.log(url, temp, hello);
    return(
        <Router>
        <div className={styles.spacers}>
            <div className='spacer'></div>
        <div className={styles.header}>
            <ul className={styles.headerul}>
                <li>khalil abdellah</li>
                <li>khalil.mktg@gmail.com</li>
                <li><a href='/resume621.pdf' target='_blank' rel="noreferrer">resume</a></li>
            </ul>
            <ul className={styles.headerul}>
                <li><Link href='/'>home</Link></li>
                <li>freq.ly used code</li>
                <li><Link href='/datajournalism'>data journalism</Link></li>
                <li>mktg / social media</li>
            </ul>
            <ul className={styles.construction}>
                <li>Site under construction..</li>
                {/* <li>Philadelphia, PA</li>
                <li><img src={url} alt='icon depicting current weather forecast'/><h5>{temp}&#176;</h5></li> */}
            </ul>
            <div className={styles.socials}>
                <a href='https://twitter.com/abdellica' target='_blank' rel="noreferrer">
                    <img src='/img/twitter.png' alt="link to Khalil Abdellah's Twitter page" />  
                </a>      
                <a href='https://linkedin.com/in/khalilabdellah' target='_blank' rel="noreferrer">
                    <img src='/img/linkedin.png' alt="link to Khalil Abdellah's LinkedIn page" />
                </a>
                <a href='https://github.com/cv-net' target='_blank' rel="noreferrer">
                    <img src='/img/github.png' alt="link to Khalil Abdellah's GitHub page" />
                </a>
            </div>
        </div>
            <div className='spacer'></div>
        </div>

        </Router>

    );
}

