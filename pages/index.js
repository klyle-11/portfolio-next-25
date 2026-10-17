import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import styled from 'styled-components';
import Layout from '../components/Layout';
import Bio from '../components/Bio';


const HomeStyle = styled.div`
  body {
    font-family: sans-serif, 'Segoe-UI';
  }
  .nav {
    width: 100%;
    height: 20%;
    padding: 1em;
    margin: 0 auto;
    color: white;
    background-color: #CDCDCD;
  }
  .blog {
    padding: 1em;
    background-color: black; !important
    color: white;
    background-image: url('/img/ibnalrabin.png')
  }
`

export default function Home({slugs}) {
  return(
    <Layout>    
      <HomeStyle>
        <Bio />
        <div className='blog' id='blog'>
          Markdown blog posts:
          {slugs.map(slug => {
            return (
              <div key={slug}>
                <Link href={`/blog/${slug}`}>
                  {`/blog/${slug}`}
                </Link>
              </div>
            );
          })}
        </div>
      </HomeStyle>
    </Layout>
  );
}

export const getStaticProps = async () => {
  const files = fs.readdirSync('posts');
  return {
    props: {
      slugs: files.map(filename => filename.replace('.md', ''))
    }
  }
}
