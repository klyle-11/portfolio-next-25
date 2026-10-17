import React from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import Layout from '../components/Layout';
import Bio, { BIO_BLOCKS } from '../components/Bio';
import { getBlogSlugs, getProjects } from '../lib/posts';
import { getBlocks } from '../lib/blocks';


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

export default function Home({slugs, blocks, projects}) {
  return(
    <Layout>    
      <HomeStyle>
        <Bio blocks={blocks} projects={projects} />
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
  return {
    props: {
      slugs: await getBlogSlugs(),
      projects: await getProjects(),
      blocks: await getBlocks(Object.keys(BIO_BLOCKS))
    }
  }
}
