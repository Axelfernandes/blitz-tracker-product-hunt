export interface PHProduct {
  id: string;
  name: string;
  tagline: string;
  description?: string;
  thumbnail: {
    url: string;
  };
  votedUpByCount: number;
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
            votedUpByCount
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
      return [];
    }

    return json.data.posts.edges.map((edge: any) => edge.node);
  } catch (error) {
    console.error("Failed to fetch PH products:", error);
    return [];
  }
}
