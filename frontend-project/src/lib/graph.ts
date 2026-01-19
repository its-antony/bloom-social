import { GRAPH_URL } from "./contracts";

// ============ Types ============

export interface GraphContent {
  id: string;
  author: string;
  likeAmount: string;
  deadline: string;
  authorPool: string;
  likerRewardPool: string;
  totalWeight: string;
  likeCount: string;
  contentURI: string;
  contentHash: string;
  createdAt: string;
  authorClaimed: boolean;
  likers?: GraphLike[];
}

export interface GraphLike {
  id: string;
  liker: string;
  likeIndex: string;
  weight: string;
  claimed: boolean;
  likedAt: string;
}

export interface GraphUser {
  id: string;
  totalEarned: string;
  totalLiked: string;
  followersCount: string;
  followingCount: string;
  contentsCreated: string;
}

export interface GraphFollow {
  id: string;
  follower: string;
  followee: string;
  followedAt: string;
}

// ============ Queries ============

export const CONTENTS_QUERY = `
  query GetContents($first: Int!, $skip: Int!, $orderBy: String!, $orderDirection: String!) {
    contents(first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      author
      likeAmount
      deadline
      authorPool
      likerRewardPool
      totalWeight
      likeCount
      contentURI
      contentHash
      createdAt
      authorClaimed
    }
  }
`;

export const CONTENT_DETAIL_QUERY = `
  query GetContent($id: ID!) {
    content(id: $id) {
      id
      author
      likeAmount
      deadline
      authorPool
      likerRewardPool
      totalWeight
      likeCount
      contentURI
      contentHash
      createdAt
      authorClaimed
      likers(first: 100, orderBy: likeIndex, orderDirection: asc) {
        id
        liker
        likeIndex
        weight
        claimed
        likedAt
      }
    }
  }
`;

export const USER_CONTENTS_QUERY = `
  query GetUserContents($author: Bytes!, $first: Int!, $skip: Int!) {
    contents(
      where: { author: $author }
      first: $first
      skip: $skip
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      author
      likeAmount
      deadline
      authorPool
      likerRewardPool
      totalWeight
      likeCount
      contentURI
      contentHash
      createdAt
      authorClaimed
    }
  }
`;

export const USER_LIKES_QUERY = `
  query GetUserLikes($liker: Bytes!, $first: Int!, $skip: Int!) {
    likes(
      where: { liker: $liker }
      first: $first
      skip: $skip
      orderBy: likedAt
      orderDirection: desc
    ) {
      id
      liker
      likeIndex
      weight
      claimed
      likedAt
      content {
        id
        author
        likeAmount
        deadline
        authorPool
        likerRewardPool
        totalWeight
        likeCount
        contentURI
        createdAt
        authorClaimed
      }
    }
  }
`;

export const USER_QUERY = `
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      totalEarned
      totalLiked
      followersCount
      followingCount
      contentsCreated
    }
  }
`;

export const USER_FOLLOWING_QUERY = `
  query GetUserFollowing($follower: Bytes!, $first: Int!, $skip: Int!) {
    follows(
      where: { follower: $follower }
      first: $first
      skip: $skip
      orderBy: followedAt
      orderDirection: desc
    ) {
      id
      follower
      followee
      followedAt
    }
  }
`;

export const USER_FOLLOWERS_QUERY = `
  query GetUserFollowers($followee: Bytes!, $first: Int!, $skip: Int!) {
    follows(
      where: { followee: $followee }
      first: $first
      skip: $skip
      orderBy: followedAt
      orderDirection: desc
    ) {
      id
      follower
      followee
      followedAt
    }
  }
`;

// ============ Fetch Functions ============

export async function graphFetch<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const response = await fetch(GRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Graph request failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(data.errors[0]?.message || "Graph query error");
  }

  return data.data;
}

export async function fetchContents(
  first = 20,
  skip = 0,
  orderBy = "createdAt",
  orderDirection = "desc"
): Promise<GraphContent[]> {
  const data = await graphFetch<{ contents: GraphContent[] }>(CONTENTS_QUERY, {
    first,
    skip,
    orderBy,
    orderDirection,
  });
  return data.contents || [];
}

export async function fetchContentDetail(
  id: string
): Promise<GraphContent | null> {
  const data = await graphFetch<{ content: GraphContent | null }>(
    CONTENT_DETAIL_QUERY,
    { id }
  );
  return data.content;
}

export async function fetchUserContents(
  author: string,
  first = 20,
  skip = 0
): Promise<GraphContent[]> {
  const data = await graphFetch<{ contents: GraphContent[] }>(
    USER_CONTENTS_QUERY,
    { author: author.toLowerCase(), first, skip }
  );
  return data.contents || [];
}

export async function fetchUserLikes(
  liker: string,
  first = 20,
  skip = 0
): Promise<(GraphLike & { content: GraphContent })[]> {
  const data = await graphFetch<{
    likes: (GraphLike & { content: GraphContent })[];
  }>(USER_LIKES_QUERY, {
    liker: liker.toLowerCase(),
    first,
    skip,
  });
  return data.likes || [];
}

export async function fetchUser(address: string): Promise<GraphUser | null> {
  const data = await graphFetch<{ user: GraphUser | null }>(USER_QUERY, {
    id: address.toLowerCase(),
  });
  return data.user;
}

export async function fetchUserFollowing(
  follower: string,
  first = 20,
  skip = 0
): Promise<GraphFollow[]> {
  const data = await graphFetch<{ follows: GraphFollow[] }>(
    USER_FOLLOWING_QUERY,
    { follower: follower.toLowerCase(), first, skip }
  );
  return data.follows || [];
}

export async function fetchUserFollowers(
  followee: string,
  first = 20,
  skip = 0
): Promise<GraphFollow[]> {
  const data = await graphFetch<{ follows: GraphFollow[] }>(
    USER_FOLLOWERS_QUERY,
    { followee: followee.toLowerCase(), first, skip }
  );
  return data.follows || [];
}
