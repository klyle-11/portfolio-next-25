import React, { useEffect } from 'react';
import Card from './Card';
import { StaticRouter as Router, Route, Link, Switch } from 'react-router-dom';
import styles from './Bio.module.scss';
import styled from 'styled-components';

const TableauStyle = styled.div`       
    .tableauPlaceholder {
        position: relative;

        img {
            border: none;
        }
    }

    .tableauViz {
        display: none;
    }

    @media (max-width: 416px) {
        .tableauPlaceholder {
            width: 100%;
            height: 50%;
        }
    }
`

const FigmaStyle = styled.div`
    .iframe {
        border: 1px solid rgba(0, 0, 0, 0.1);
    }

`


export default function Bio() {
    useEffect(() => {
        const fig3 = document.createElement('script');
        
        fig3.src = "/fig3.js";
        fig3.async = true;
        
        document.body.appendChild(fig3);
        
        return () => {
            document.body.removeChild(fig3);
        }
}, []);

    return(
        <Router>
            <Switch>
        <div>
            <div className={styles.bio}>
            <div>
                <h2>Khalil Abdellah</h2>
                <p className='serif'>khalil.mktg@gmail.com</p>
                    <p>
                        I'm a recent graduate in Marketing from Temple University, 
                        building skills and looking for experience in UX, web development, and SEO. This site was built using Next.js and React Hooks. <br/><br/>
                        My biggest interest now is using UX design principles for journalism, communication design, and accessible tools that aid learning in all stages of life.
                    </p>
                    <p><a href='/resume621.pdf' target='_blank' rel='noreferrer'>Resume</a> | <a href='https://twitter.com/abdellica' target='_blank' rel='noreferrer'>Twitter</a></p>
            </div>

            </div>
        <div className={styles.projects}>
            <h2>Projects</h2>
            <hr />
            <div className={styles.projectcard} >
                <Link to='/datajournalism'><h3 className='serif'>Plastic Bag Props</h3></Link>
                <p>
                    Data visualization using Tableau, with editorial. Data analysis using Python and Pandas. <Link to='/datajournalism'>Click for article.</Link>
                </p>
                <Link to='/datajournalism' >
                    <TableauStyle>
                    <div className='tableauPlaceholder' id='viz1622950425084'>
                        <noscript>
                            <a href='#'>
                                <img alt='American Progressive Bag Alliance:Prop. 65&#39;s Supporting Committees and Contributions 2013-16 ' src='https:&#47;&#47;public.tableau.com&#47;static&#47;images&#47;Pr&#47;Prop65sSupportingCommitteesandContributions&#47;Sheet1&#47;1_rss.png'/>
                            </a>
                        </noscript>
                        <object className='tableauViz'>
                            <param name='host_url' value='https%3A%2F%2Fpublic.tableau.com%2F' /> 
                            <param name='embed_code_version' value='3' /> 
                            <param name='site_root' value='' />
                            <param name='name' value='Prop65sSupportingCommitteesandContributions&#47;Sheet1' />
                            <param name='tabs' value='no' /><param name='toolbar' value='yes' />
                            <param name='static_image' value='https:&#47;&#47;public.tableau.com&#47;static&#47;images&#47;Pr&#47;Prop65sSupportingCommitteesandContributions&#47;Sheet1&#47;1.png' /> 
                            <param name='animate_transition' value='yes' /><param name='display_static_image' value='yes' />
                            <param name='display_spinner' value='yes' /><param name='display_overlay' value='yes' />
                            <param name='display_count' value='yes' /><param name='language' value='en-US' />
                        </object>
                    </div>  
                    </TableauStyle>
                </Link>

            </div>
            <hr />
            <div className={styles.projectcard}>
                <h3 className='serif'>React Pomodoro Timer (WIP)</h3>
                <p>
                    Productivity aid built with create-react-app framework, Hooks, and Styled Components.
                </p>
                <Card />
            </div>
            <hr />
            <div className={styles.projectcard}>
                <h3 className='serif'>Figma UI Prototype</h3>
                <p>Mock Human Resources dashboard for a wellness app for mobile and web. Click through to view the prototype. <br/><br/> Click 'Khalil Abdellah' in the list to move forward in the prototype. Click the dropdown to reveal more info, and the back button to go back to the top.</p>
                <a href='https://www.figma.com/proto/ITLy2reBt5kvUJuadEkfZR/Assessment-Acme-Corp.-Wellness-App?page-id=0%3A1&node-id=31%3A231&viewport=477%2C283%2C0.13850635290145874&scaling=contain' target='_blank' rel='noreferrer' >
                    <img src='/img/figma.png' alt='Figma Prototype UI' />
                </a>
            </div>
            <hr/>
        </div>
        </div>
        </Switch>
        </Router>
    );
}