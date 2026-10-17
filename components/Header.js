import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './Header.module.scss';
import { EMAIL, GITHUB_URL, LINKEDIN_URL, RESUME_URL } from '../lib/links';

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
    const [constructionDate, setConstructionDate] = useState('');
    const [constructionTime, setConstructionTime] = useState('');

    useEffect(() => {
        const updateTimestamp = () => {
            const now = new Date();
            const formattedDate = new Intl.DateTimeFormat('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                timeZone: 'America/New_York',
            }).format(now);
            const formattedTime = new Intl.DateTimeFormat('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: 'America/New_York',
            }).format(now);

            setConstructionDate(formattedDate);
            setConstructionTime(`${formattedTime} EST`);
        };

        updateTimestamp();
        const intervalId = setInterval(updateTimestamp, 60000);

        return () => clearInterval(intervalId);
    }, []);

    return(
        <div className={styles.spacers}>
            <div className='spacer'></div>
            <div className={styles.header}>
                <ul className={styles.headerul}>
                    <li>khalil abdellah</li>
                    <li><a href={`mailto:${EMAIL}`}>{EMAIL}</a></li>
                    <li><a href={RESUME_URL} target='_blank' rel="noreferrer" data-admin-upload='resume'>resume</a></li>
                </ul>
                {/* <ul className={styles.headerul}>
                    <li><Link href='/'>home</Link></li>
                    <li>freq.ly used code</li>
                    <li><Link href='/datajournalism'>data journalism</Link></li>
                </ul> */}
                <ul className={styles.construction}>
                    {/* <li>Site under construction..</li> */}
                    {constructionDate && <li>{constructionDate}</li>}
                    {constructionTime && <li>{constructionTime}</li>}
                    {/* <li>Philadelphia, PA</li>
                    <li><img src={url} alt='icon depicting current weather forecast'/><h5>{temp}&#176;</h5></li> */}
                </ul>
                <div className={styles.socials}>
                    {/* <a href='https://twitter.com/abdellica' target='_blank' rel="noreferrer">
                        <img src='/img/twitter.png' alt="link to Khalil Abdellah's Twitter page" />  
                    </a>       */}
                    <a href={LINKEDIN_URL} target='_blank' rel="noreferrer">
                        <img src='/img/linkedin.png' alt="link to Khalil Abdellah's LinkedIn page" />
                    </a>
                    <a href={GITHUB_URL} target='_blank' rel="noreferrer">
                        <img src='/img/github.png' alt="link to Khalil Abdellah's GitHub page" />
                    </a>
                </div>
            </div>
            <div className='spacer'></div>
        </div>
    );
}

