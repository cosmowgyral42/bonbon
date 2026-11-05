import "server-only";

// Buffer's GraphQL API (https://developers.buffer.com). Auth = personal API key
// from publish.buffer.com/settings/api, sent as a Bearer token.
const ENDPOINT = "https://api.buffer.com";

export class BufferError extends Error {}

async function gql<T>(key: string, query: string, variables: Record<string, unknown> = {}): Promise<T> {
  if (!key) throw new BufferError("No Buffer API key yet — add one in Settings.");
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  let json: { data?: T; errors?: { message: string; extensions?: { code?: string } }[] };
  try {
    json = await res.json();
  } catch {
    throw new BufferError(`Buffer returned HTTP ${res.status}`);
  }
  if (json.errors?.length) {
    const e = json.errors[0];
    const code = e.extensions?.code;
    if (code === "UNAUTHORIZED" || /token is not valid|not authori[sz]ed/i.test(e.message)) throw new BufferError("Buffer didn't accept that API key.");
    if (code === "RATE_LIMIT_EXCEEDED") throw new BufferError("Buffer rate limit hit — try again in a few minutes.");
    throw new BufferError(`Buffer: ${e.message}`);
  }
  if (!json.data) throw new BufferError("Empty response from Buffer.");
  return json.data;
}

export type BufferOrg = { id: string; name: string };
export type BufferChannel = { id: string; name: string; displayName?: string; service: string; avatar?: string };

export async function listOrgs(key: string) {
  const d = await gql<{ account: { organizations: BufferOrg[] } }>(
    key,
    `query { account { organizations { id name } } }`,
  );
  return d.account.organizations;
}

export async function listChannels(key: string, organizationId: string) {
  const d = await gql<{ channels: BufferChannel[] }>(
    key,
    `query Channels($input: ChannelsInput!) { channels(input: $input) { id name displayName service avatar } }`,
    { input: { organizationId } },
  );
  return d.channels;
}

type MutationResult = { post?: { id: string; dueAt?: string }; message?: string };

const POST_RESULT = `
  ... on PostActionSuccess { post { id dueAt } }
  ... on MutationError { message }
`;

const toAssets = (imageUrls: string[]) => imageUrls.map((url) => ({ image: { url } }));

export async function createScheduledPost(key: string, channelId: string, text: string, dueAt: string, imageUrls: string[] = []) {
  const d = await gql<{ createPost: MutationResult }>(
    key,
    `mutation Create($input: CreatePostInput!) { createPost(input: $input) { ${POST_RESULT} } }`,
    {
      input: {
        text,
        channelId,
        schedulingType: "automatic",
        mode: "customScheduled",
        dueAt,
        ...(imageUrls.length ? { assets: toAssets(imageUrls) } : {}),
      },
    },
  );
  if (!d.createPost.post) throw new BufferError(d.createPost.message || "Buffer couldn't create the post.");
  return d.createPost.post;
}

export async function editScheduledPost(key: string, id: string, text: string, dueAt: string, imageUrls: string[] = []) {
  const d = await gql<{ editPost: MutationResult }>(
    key,
    `mutation Edit($input: EditPostInput!) { editPost(input: $input) { ${POST_RESULT} } }`,
    // assets is the full ordered list; an empty array clears images in Buffer
    { input: { id, text, mode: "customScheduled", dueAt, assets: toAssets(imageUrls) } },
  );
  if (!d.editPost.post) throw new BufferError(d.editPost.message || "Buffer couldn't update the post.");
  return d.editPost.post;
}

export async function deletePost(key: string, id: string) {
  const d = await gql<{ deletePost: { id?: string; message?: string } }>(
    key,
    `mutation Del($input: DeletePostInput!) { deletePost(input: $input) {
      ... on DeletePostSuccess { id }
      ... on MutationError { message }
    } }`,
    { input: { id } },
  );
  if (!d.deletePost.id) throw new BufferError(d.deletePost.message || "Buffer couldn't delete the post.");
}

export type BufferPost = { id: string; text: string; dueAt: string | null; channelId: string; status?: string };

export async function listScheduledPosts(key: string, organizationId: string, channelId?: string) {
  const out: BufferPost[] = [];
  let after: string | null = null;
  for (let page = 0; page < 5; page++) {
    const d: { posts: { edges: { node: BufferPost }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } } =
      await gql(
        key,
        `query Posts($input: PostsInput!, $after: String) {
          posts(first: 50, after: $after, input: $input) {
            edges { node { id text dueAt channelId status } }
            pageInfo { hasNextPage endCursor }
          }
        }`,
        {
          after,
          input: {
            organizationId,
            sort: [{ field: "dueAt", direction: "asc" }],
            filter: { status: ["scheduled"], ...(channelId ? { channelIds: [channelId] } : {}) },
          },
        },
      );
    out.push(...d.posts.edges.map((e) => e.node));
    if (!d.posts.pageInfo.hasNextPage) break;
    after = d.posts.pageInfo.endCursor;
  }
  return out;
}
