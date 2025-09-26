import React from 'react';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter'; //for gray matter
import Head from 'next/head';
import marked from 'marked';
import Layout from '../../components/Layout';

const Post = ({ htmlString, data }) => {
    return (
        <Layout>
        <Head>
            <title>{data.title}</title>
            <meta title='description' content={data.description} />
        </Head>
        <h2>{data.title}</h2>
        <h4><italics>{data.date}</italics></h4>
        <div dangerouslySetInnerHTML={{ __html: htmlString }} />
        </Layout>
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

export const getStaticProps = async ({ params: { slug } }) => { //fetch data - this is a function that returns an object of props to 

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