import Head from 'next/head';
import Header from './Header';

export default function Layout({title, keywords, description, children}) {
    return(
        <>
            <Head>
                <title>{title}</title>
                <meta name='description' content={description} />
                <meta name='keywords' content={keywords} />
            </Head>
            <Header />
            <div className='container'>
                <div className='panel'></div>
                <div className='content'>
                    {children}
                </div>
                <div className='panel'></div>
            </div>
        </>
    );
}

Layout.defaultProps = {
    title: 'Khalil Abdellah | Portfolio',
    description: "Khalil Abdellah's Web Development Portfolio",
    keywords: 'web developer, react.js, python, accessibility, note-taking apps, productivity aid'
}