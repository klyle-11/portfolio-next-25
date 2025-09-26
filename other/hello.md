---
title: yo!
description: 'new blog page'
---

### I wanna be adoooooored~

```javascript
npm install gray-matter

import matter from 'gray-matter'
```

```javascript
npm install marked
```
### Markdown SSG with Next.js code from Ben Awad
#### /pages/[slug].js
```javascript
import React from 'react';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter'; //for gray matter
import Head from 'next/head';
import marked from 'marked';

const Post = ({ htmlString, data }) => {
    return (
        <>
        <Head>
            <title>{data.title}</title>
            <meta title='description' content={data.description} />
        </Head>
        <div dangerouslySetInnerHTML={{ __html: htmlString }} />
        </>
    );
};

export const getStaticPaths = async () => { //create paths

    const files = fs.readdirSync('posts'); //return array of strings, posts is the posts folder with md;
    console.log('files: ', files) // logs files that are being rendered, available routes

    const paths = files.map(filename => ({
        params: { //pass in parameters for a particular page
            slug: filename.replace('.md', '')
        }
    })); //tell next.js what paths are in this array
    console.log('paths: ', paths)

    return {
        paths,
        fallback: false //build at build time
    }
}

export const getStaticProps = async ({ params: { slug } }) => { //fetch data

    const markdownWithMetadata = fs.readFileSync(path.join('posts', slug + '.md')).toString(); //build the path with path.join, read .md file contnets

    const parsedMarkdown = matter(markdownWithMetadata);

    const htmlString = marked(parsedMarkdown.content);

    return {
        props: {
            htmlString,
            data: parsedMarkdown.data
        }
    }
}

export default Post;
```
#### Homepage ```pages/index.js```
```javascript
import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import Link from 'next/link';
import fs from 'fs';

const Home = ({slugs}) => (
  <div>
    slugs:
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
);

export const getStaticProps = async () => {
  const files = fs.readdirSync('posts');
  return {
    props: {
      slugs: files.map(filename => filename.replace('.md', ''))
    }
  }
}

export default Home;
```


```javascript
npx export
npx serve out/ //serves out folder on local server
```