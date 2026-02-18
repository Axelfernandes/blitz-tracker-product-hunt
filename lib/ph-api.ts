export interface PHProduct {
  id: string;
  name: string;
  tagline: string;
  description?: string;
  thumbnail: {
    url: string;
  };
  votesCount: number;
  createdAt: string;
  url: string;
}

export async function fetchDailyProducts(): Promise<PHProduct[]> {
  const query = `
    query {
      posts(first: 20, order: NEWEST) {
        edges {
          node {
            id
            name
            tagline
            description
            url
            thumbnail {
              url
            }
            votesCount
            createdAt
          }
        }
      }
    }
  `;

  if (!process.env.PH_TOKEN) {
    console.error("PH_TOKEN is missing");
    return [];
  }

  try {
    const res = await fetch("https://api.producthunt.com/v2/api/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
      cache: "no-store",
    });

    const json = await res.json();
    if (json.errors) {
      console.error("PH API Errors:", json.errors);
      throw new Error(`PH API Errors: ${JSON.stringify(json.errors)}`);
    }

    if (!json.data || !json.data.posts) {
      throw new Error(`PH API Unexpected Response: ${JSON.stringify(json)}`);
    }

    return json.data.posts.edges.map((edge: any) => ({
      ...edge.node,
      votesCount: edge.node.votesCount
    }));

  } catch (error) {
    console.error("Failed to fetch PH products:", error);
    return [];
  }
}

export function extractProductSlug(url: string): string | null {
  const match = url.match(/producthunt\.com\/posts\/([a-zA-Z0-9-]+)/);
  return match ? match[1] : null;
}

export async function fetchProductBySlug(slug: string): Promise<PHProduct | null> {
  const query = `
    query GetPost($slug: String!) {
      post(slug: $slug) {
        id
        name
        tagline
        description
        url
        thumbnail {
          url
        }
        votesCount
        createdAt
      }
    }
  `;

  if (!process.env.PH_TOKEN) {
    console.error("PH_TOKEN is missing");
    return null;
  }

  try {
    const res = await fetch("https://api.producthunt.com/v2/api/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        query,
        variables: { slug }
      }),
      cache: "no-store",
    });

    const json = await res.json();
    if (json.errors) {
      console.error("PH API Errors:", json.errors);
      throw new Error(`PH API Errors: ${JSON.stringify(json.errors)}`);
    }

    if (!json.data || !json.data.post) {
      return null;
    }

    const post = json.data.post;
    return {
      ...post,
      votesCount: post.votesCount
    };

  } catch (error) {
    console.error("Failed to fetch PH product:", error);
    return null;
  }
}
