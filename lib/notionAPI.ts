import { Client } from "@notionhq/client"
import { NotionToMarkdown } from "notion-to-md";
import { NUMBER_OF_POSTS_PER_PAGE } from "../constants/constants";
import { allowedNodeEnvironmentFlags } from "process";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const n2m = new NotionToMarkdown({ notionClient: notion });


export const getAllPosts = async () => {
  const posts = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID,
    page_size: 100,
    filter: {
      property: "Published",
      checkbox: {
        equals: true,
      },
    },
    sorts: [
      {
        property: "Date",
        direction: "descending",
      },
    ]
  });

  const allPorts = posts.results;

  return allPorts.map((post) => {
    return getPageMetaData(post);
  });

}

const getPageMetaData = (post) => {
  const getTags = (tags) => {
    const allTags = tags.map((tag) => {
      return tag.name;
    });

    return allTags;
  };

  return {
    id: post.id,
    title: post.properties.Name.title[0].plain_text,
    description: post.properties.Description.rich_text[0].plain_text,
    date: post.properties.Date.date.start,
    slug: post.properties.Slug.rich_text[0].plain_text,
    tags: getTags(post.properties.Tags.multi_select),
  }
}

export const getSinglePost = async (slug) => {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID,
    filter: {
      property: "Slug",
      formula: {
        string: {
          equals: slug,
        }
      }
    }
  })

  const page = response.results[0];
  const metadata = getPageMetaData(page)
  //console.log(metadata);
  const mdBlocks = await n2m.pageToMarkdown(page.id);
  const mdString = n2m.toMarkdownString(mdBlocks);
  console.log(mdString.parent)

  return {
    metadata,
    markdown: mdString,
  }
}

/* Topページ用記事の取得(4つ) */
export const getPostsForTopPage = async (pageSige: number) => {
  const allPorts = await getAllPosts();
  const fourPosts = allPorts.slice(0, pageSige)
  return fourPosts;

}

/* ページ番号に応じた記事を取得 */
export const getPostsByPage = async (page: number) => {
  const allPorts = await getAllPosts();

  const startIndex = (page - 1) * NUMBER_OF_POSTS_PER_PAGE;
  const endIndex = startIndex + NUMBER_OF_POSTS_PER_PAGE

  return allPorts.slice(startIndex, endIndex);
}


export const getNumberOfPages = async () => {
  const allPorts = await getAllPosts();

  return Math.floor(allPorts.length/ NUMBER_OF_POSTS_PER_PAGE) + 
     (allPorts.length % NUMBER_OF_POSTS_PER_PAGE > 0 ? 1 : 0);
  
}

export const getPostByTagAndPage = async (tagName: string, page: number) => {
  const allPorts = await getAllPosts();
  const posts = allPorts.filter((post) => 
    post.tags.find((tag: string) => tag === tagName)
  )

  console.log(posts)

  const startIndex = (page - 1) * NUMBER_OF_POSTS_PER_PAGE;
  const endIndex = startIndex + NUMBER_OF_POSTS_PER_PAGE

  return posts.slice(startIndex, endIndex)
}

export const getNumberOfPagesByTag = async (tagName: string) => {
  const allPorts = await getAllPosts();
  const posts = allPorts.filter((post) => 
    post.tags.find((tag: string) => tag === tagName)
  )

  return Math.floor(posts.length/ NUMBER_OF_POSTS_PER_PAGE) + 
     (posts.length % NUMBER_OF_POSTS_PER_PAGE > 0 ? 1 : 0);
}


export const getAllTags = async () => {
  const allPosts = await getAllPosts();

  const allTagsDuplicationLists = allPosts.flatMap((post) => post.tags)
  const set = new Set(allTagsDuplicationLists);
  const alltagList = Array.from(set);
  //console.log(alltagList)

  return alltagList;
}