import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import Link from 'next/link';
import fs from 'fs';
import styled from 'styled-components';
import { StaticRouter as Router, Route, Switch} from 'react-router-dom';
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
    <Router>
    <Layout>    
      <HomeStyle>
        <Bio />
        <div className='blog' id='blog'>
          Markdown blog posts:
          {slugs.map(slug => {
            return (
              <div key={slug}>
                <Link href={'/blog/' + slug}>
                  <a> {'/blog/' + slug} </a>
                </Link>
              </div>
            );
          })}
        </div>
      </HomeStyle>
    </Layout>
    </ Router>
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
