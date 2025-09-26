import styled from 'styled-components';
import Image from 'next/image';
import Layout from '../components/Layout';
import React, { useEffect } from 'react';

const PlasticBag = styled.div`
    @media (max-width: 415px) {
        width: 100%;
    }
    font-family: sans-serif, 'Segoe-UI';
    display: grid;

    img {
        width: 70%;
        object-fit: fill;
        height: 7=100%;
    }
    .APBA {
        float: right;
        height: 100%;
        width: 10%;
        display: inline;
    }

//     .img-container {
//         height: 50vh;
//     }

    p {
        line-height: 200%;
    }

    h3 {
        padding-bottom: .5em;
    }

    h4 {
        padding-bottom: .5em;
        letter-spacing: .2em;
    }
    h5 {
        text-align: left;
    }
    h6 {
        font-family: serif, 'Footlight MT Light';
    }
    .paragraph {
        padding-bottom: 1em;
        line-height: 150%;
    }
    .APBApara {
        width: 60%;
    }
    .callout {
        background-color: #CDCDEB;
        padding: 1.5em;
        margin-bottom: 1em;
        border-radius: 5%;
        line-height: 170%;
    }
    .citations {}
    li {
        padding-bottom: 1em;
    }
    object {
        display:none;
    }
    .tableauPlaceholder {
        position: relative;
        img {
                border: none
        }
    }
`

function PlasticBagProps() {

        // useEffect(() => {
        //         const fig2 = document.createElement('script');
        //         // const fig3 = document.createElement('script');
                
        //         fig2.src = "/fig2.js";
        //         fig2.async = true;
        //         // fig3.src = "/fig3.js";
        //         // fig3.async = true;
                
        //         document.body.appendChild(fig2);
        //         // document.body.appendChild(fig3);
                
        //         return () => {
        //                 document.body.removeChild(fig2);
        //                 // document.body.removeChild(fig3);
        //         }
        // }, []);

    return(
<Layout>
    <PlasticBag>
        <h2>Plastic Bag Propositions and Political Tricks</h2>
        <h4>Tableau data visualizations and editorial project from First Python Notebook</h4>
        <h4>by Khalil Abdellah</h4>
        <p><a href='https://github.com/cv-net/plastic-bag-props' target='_blank' rel="noreferrer">Project GitHub</a> | <a href='https://public.tableau.com/profile/khalil6901#!/?newProfile=&activeTab=0'>My Tableau Profile</a></p>
        <hr/>
            <div className='paragraph'>
    This project is the product of an introductory course to data journalism, <a href='https://www.firstpythonnotebook.org/about/index.html' target='_blank' rel="noreferrer">First Python Notebook.</a>  
     First Python Notebook used data from the <a href='https://www.californiacivicdata.org/' target='_blank' rel="noreferrer">California Civic Data Coalition (CCDC)</a>, which cleans and 
    organizes publicly available political campaign finance data from the state of California (<a href='https://cal-access.sos.ca.gov/' target='_blank' rel="noreferrer">CAL-ACCESS</a>). 
    The course focused on data from California's 2016 Ballot Propositions, interviewing the data, and 
    visualizing it with Python Jupyter Notebook while emphasizing the journalistic knowledge and 
    sense needed to interpret the data responsibly. 
            </div>
            <div className='paragraph'>
    For example, the data provided by CAL-ACCESS only reports campaign contributions greater than $100. 
    The course only provided half of the complete contribution data, as the other half were early 
    contributions from 2013-14, likely not necessary for the aims of the introductory course. 
            </div>
            <div className='paragraph'>
    Even with missing data, the visualization for Proposition 67's contributions (Figure 1) may 
    perhaps be considered representative of the many, small donations made to the proposition. 
    I was able to acquire and clean the missing data from Proposition 65, and all of it is 
    reflected in Figure 2.            
            </div>
            <div className='paragraph'>
    The visualizations below were created in Tableau, after geocoding the data based on the 
    ZIP codes provided in the CCDC dataset.            
            </div>
                <hr />
                <div className='paragraph'>
        <span id='lede'>In 2016</span>, there were twin propositions on California's ballot, Propositions 65 and 67. 
        These propositions were on the ballot because of a successful veto of SB-270, the plastic bag ban, 
        which was signed into law two years earlier. Proposition 67 represented SB-270, and Proposition 65 the APBA's veto. 
        The veto was petitioned by the American Progressive Bag Alliance (APBA), who disguised a clear conflict of interest with the plastic bag ban.
                </div>
                <div className='paragraph'>
        Under SB-270, single-use plastic bags would be replaced with 
        re-usable bags, which would be for sale to grocery store customers. Under Proposition 67, the revenue from the sale of those reusable bags would 
        go back to grocery store owners, to cover their costs for manufacturing and procuring the bags, and educating customers
        on sustainable shopping.
                </div>
                <div className='paragraph'>
        The APBA presented Proposition 65 as a more sustainable version of Proposition 67 in its ballot narrative. 
        65 said that the revenue from re-usable bag sales would go to an Environmental Protection and Enhancement Fund (EPEF). 
                </div>
                <div className='paragraph callout'>
                        <em>
                "The Wildlife Conservation Board would have utilized the fund for environmental protection and 
                grants to environmental conservation organizations. Grants could have been used for drought mitigation; 
                clean drinking water supplies; recycling; litter removal; wildlife habitat restoration; beach cleanup; 
                and state, regional, and local parks." - Ballotpedia.com
                        </em>
                </div>

            <div className='paragraph'>
        It may have seemed, to an uninformed voter, that the main difference between Propositions 65 and 67 
        was about where the revenue the bags would go.
    Though the EPEF seems a worthwhile cause, environmentalist support <a href='https://ballotpedia.org/California_Proposition_67,_Plastic_Bag_Ban_Veto_Referendum_(2016)#Support_for_.22yes.22_vote' target='_blank' rel="noreferrer">largely fell with Proposition 67</a>. 
    That's a hint to the underlying motives of the APBA in vetoing Proposition 65, which the campaign finance data will begin to 
    clarify. 
            </div>
            <div className='paragraph'>
    This is a first look at the campaign finance data, provided by the California Civic Data Coalition. 
    It immediately stuck out that the same 5 contributors that supported Proposition 65, opposed Proposition 67. 
    This was because the two propositions were listed together as the result of a successful petition in California courts.
            </div>
            <img src='/img/plastic_bag_props/fig.1.jpg' alt='Figure 1'/>
            <p>Fig. 1, a screenshot from the Python notebook for this project. Available on Github after the jump.</p>
            <div className='paragraph APBApara'>
    These 5 companies contributed to the one committee sponsoring the proposition, the American Progressive Bag Alliance. Proposition 65's supporters were listed as opposition to Proposition 67.
    Proposition 65 didn't have any opposing contributions, probably because it wouldn't have been worth taking 
    focus away from Proposition 67.            
            </div>
            {/* <img src={figure7} className='APBA' alt='Logo for the American Progressive Bag Alliance'/> */}
            <a href='https://public.tableau.com/views/Prop65sSupportingCommitteesandContributions/Sheet1?:language=en&:display_count=y&:origin=viz_share_link'>
                    <img src='/img/plastic_bag_props/fig.2.jpg' alt='Figure 2'/></a>
            <p>Figure 2, available on <a href='https://public.tableau.com/views/Prop65sSupportingCommitteesandContributions/Sheet1?:language=en&:display_count=y&:origin=viz_share_link'>Tableau Public.</a></p>
            <div className='paragraph'>
    Contributions supporting Prop. 65 averaged $99,311.60 (27 contributions) which is, on average, over 300x higher than those supporting Prop. 67.
            </div>
            <h3>"STOP THE SWEETHEART BAG TAX DEAL. HELP THE ENVIRONMENT"</h3>
            <div className='paragraph'>
    The official ballot argument for Proposition 65 that was presented to voters claimed that grocery stores 
    would profit from selling paper bags in place of plastic bags. Prop. 65's redirection of funds from 
    grocery stores to the EPEF claimed to prevent profiteering, to keep the environmentalist effort pure. 
            </div>
            <div className='paragraph callout'>
    Prop. 65 official ballot narrative, presented to voters in the booth

    "DON'T BE FOOLED BY PROP 67. 
    It is a $300 million per year HIDDEN TAX INCREASE on California consumers who will be forced to pay a 
    minimum 10 cents for every paper and thick plastic grocery bag they are given at the checkout.
    And not one penny goes to the environment. Instead, the Legislature gave all $300 million in new tax 
    revenue to grocers as extra profit.
    Stop the sweetheart special interest deal... VOTE NO ON PROP 67. "
            </div>
            <div className='paragraph'>
    In spite of this, Proposition 67 had many small contributors, largely from California residents.
            </div>
            <h3>Prop. 67 - REFERENDUM TO OVERTURN BAN ON SINGLE-USE PLASTIC BAGS.</h3>
            <a href='https://public.tableau.com/views/Prop67Contributions/Sheet1?:language=en&:display_count=y&:origin=viz_share_link'><img src='/img/plastic_bag_props/fig.3.jpg' alt='Figure 3'/></a>
            <p>Figure 3, available on <a href='https://public.tableau.com/views/Prop67Contributions/Sheet1?:language=en&:display_count=y&:origin=viz_share_link'>Tableau Public</a></p>
            <ul>
                <li>
                    6,252 in support out of 6,279 total contributions, 99%
                </li>
                <li>
                    Average contribution of $286.17
                </li>
            </ul>
            <img src='/img/plastic_bag_props/fig.4.jpg' alt='Figure 4'/>
            <p>
                Figure 4, from <a href='https://github.com/mourtallah/CA-Ballot-Props' target='_blank' rel="noreferrer">Money in Politics : An Analysis of 2016 California Ballot Propositions Contributions 
                by Serigne Mourtallah M'backe Faye, 2021</a> 
            </p>
            <div className='paragraph'>
    When looking at all the California ballot propositions in 2016, Prop. 67 was on the higher end 
    with 6,000+ contributors, as opposed to Prop. 65's five contributors.
            </div>
            <img src='/img/plastic_bag_props/fig.5.jpg' alt='Figure 5'/>
            <p>Figure 5, a screenshot from the Python notebook for the project, available on Github.</p>
            <div className='paragraph'>
    Prop. 67 raised only about 2/3 of what Prop. 65 raised, which was largely done by the four plastics producers.
            </div>
            <h3>67 vs. 65</h3>
            <div className='paragraph'>
    We find the fine print of Proposition 65, something that makes a little more sense for a plastic bag company to support, on <a href='https://ballotpedia.org/California_Proposition_65,_Dedication_of_Revenue_from_Disposable_Bag_Sales_to_Wildlife_Conservation_Fund_(2016)' target='_blank' rel="noreferrer">Ballotpedia</a>.
            </div>
            <div className='img-container'><img src='/img/plastic_bag_props/fig.6.jpg' alt='Figure 6'/></div>
            <p>Figure 6, from Ballotpedia.</p>
            <div className='paragraph'>
    Prop. 65 would have only succeeded in its surface aims if it both props won, and 65 succeeded with a 
    greater margin than67's winning margin. 

    There was a quirk in Section 6(a) of Prop. 65 that meant that if Prop. 67 failed while Prop. 65 passed, 
    then there would be no plastic bag ban in the first place. 

    The opposing argument presented on the ballot accused Proposition 65 and its supporters of trying to 
    confuse voters into voting against the plastic bag ban altogether. This is supported when we look at 
    who contributed: four plastics companies, against the citizens of California.
            </div>
            <div className='callout'>
                <div className='paragraph'>
    Prop. 67 official ballot narrative, presented to voters in the booth.

    "YES on 67 to REDUCE LITTER, PROTECT OUR OCEAN and WILDLIFE, and REDUCE CLEAN-UP COSTS.
    Single-use plastic shopping bags create some of the most visible litter that blows into our parks, 
    trees and neighborhoods, and washes into our rivers, lakes and ocean. A YES vote will help keep discarded 
    plastic bags out of our mountains, valleys, beaches and communities, and keep them beautiful. 
    The law also will save our state and local  communities tens of millions of dollars in litter clean-up costs.

    OUT-OF-STATE PLASTIC BAG COMPANIES ARE OPPOSING CALIFORNIA'S PROGRESS
    Opposition to this law is funded by four large out-of-state state plastic bag companies. They don't want 
    California to take leadership on plastic bag waste, and are trying to defeat this measure to protect their profits.
    Don't believe their false claims. We should give California's plastic bag law a chance to work, especially 
    with so much success already at the local level."            
                </div>
            </div>
            <h3>Political Tricks</h3>
            <div className='paragraph'>
    In this story, a few plastic bag companies making up the APBA put their money together and created a 
    misleading proposition to sabotage the Prop. 67 plastic bag ban. That Prop. 65 was listed in opposition 
    to Prop. 67, and that Prop. 65 was sponsored by plastic bag companies, suggests that 65 was 
    dishonest in its framing. The APBA's proposition 65 claimed to be even more environmentalist 
    than the initial plastic bag ban. In fact, Prop. 65 was as profit-driven and environmentally 
    destructive as it accused Prop. 67 of being. The APBA was the real 'sweetheart', trying to 
    meet its own industries needs at the expense of the environment. 
            </div>
            <div className='paragraph'>
    The story of Propositions 67 and 65 is important less because of plastic, and more because it's gross example of political tricks at 
    the state level. Politicians use disingenuous narratives and <a href='https://www.theverge.com/2020/12/29/22204976/section-230-senate-deal-stimulus-talks-checks' target='_blank' rel="noreferrer">use policies as bargaining chips for 
    partisan aims</a>. These sorts of tricks have been somewhat normalized, but open civic data makes it possible to distinguish these stories and bring them back to voter discourse.
            </div>

        <div className='citations'>
        <h3>Citations:</h3>
        <ul>
                <li>
                        <a href='https://github.com/mourtallah/CA-Ballot-Props' target='_blank' rel="noreferrer">
                                Money in Politics : An Analysis of 2016 California Ballot Propositions Contributions by Serigne Mourtallah M'backe Faye, 2021 
                        </a>
                </li>
                <li>
                        <a href='https://ballotpedia.org/California_Proposition_65,_Dedication_of_Revenue_from_Disposable_Bag_Sales_to_Wildlife_Conservation_Fund_(2016)' target='_blank' rel="noreferrer">
                                California Proposition 65, Dedication of Revenue from Disposable Bag Sales to Wildlife Conservation Fund (2016)
                        </a>
                </li>
                <li>
                        <a href='https://www.firstpythonnotebook.org/' target='_blank' rel="noreferrer">
                                Data provided by the California Civic Data Coalition via First Python Notebook (Ben Welsh, 2020) 
                        </a>
                </li>
                <li>
                        <a href='https://www.chicagotribune.com/nation-world/chi-california-governor-plastic-bag-ban-20140930-story.html' target='_blank' rel="noreferrer">
                                California governor signs phase-out of plastic bags by Patrick McGreevy (2014)
                        </a>
                </li>
        </ul>
        </div>
        {/* <div class='tableauPlaceholder' id='viz1621453079925' >
                <noscript>
                        <a href='#'>
                                <img alt='Prop. 67 Contribution Amounts:Portion of total data ' src='https:&#47;&#47;public.tableau.com&#47;static&#47;images&#47;Pr&#47;Prop67Contributions&#47;Sheet1&#47;1_rss.png' />
                        </a>
                </noscript>
                <object class='tableauViz' >
                        <param name='host_url' value='https%3A%2F%2Fpublic.tableau.com%2F' /> 
                        <param name='embed_code_version' value='3' /> 
                        <param name='site_root' value='' />
                        <param name='name' value='Prop67Contributions&#47;Sheet1' />
                        <param name='tabs' value='no' />
                        <param name='toolbar' value='yes' />
                        <param name='static_image' value='https:&#47;&#47;public.tableau.com&#47;static&#47;images&#47;Pr&#47;Prop67Contributions&#47;Sheet1&#47;1.png' /> 
                        <param name='animate_transition' value='yes' />
                        <param name='display_static_image' value='yes' />
                        <param name='display_spinner' value='yes' />
                        <param name='display_overlay' value='yes' />
                        <param name='display_count' value='yes' />
                        <param name='language' value='en' />
                </object>
        </div>                 */}

        </PlasticBag>
        </Layout>

    );
}

export default PlasticBagProps;