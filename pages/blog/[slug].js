import React from 'react';
import Head from 'next/head';
import marked from 'marked';
import Layout from '../../components/Layout';
import { getPost, getPostSlugs } from '../../lib/posts';

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

export const getStaticPaths = async () => {
    const slugs = await getPostSlugs();
    return {
        paths: slugs.map(slug => ({ params: { slug } })),
        fallback: 'blocking' // posts published after the deploy get rendered on first request
    }
}

export const getStaticProps = async ({ params: { slug } }) => {
    const post = await getPost(slug);
    if (!post) return { notFound: true };

    return {
        props: {
            htmlString: marked(post.content),
            data: post.data
        }
    }
}

export default Post;