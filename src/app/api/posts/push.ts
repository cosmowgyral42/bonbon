import "server-only";
import { BufferError, createScheduledPost, deletePost, editScheduledPost } from "@/lib/buffer";
import { ensurePublicImages } from "@/lib/media";
import { bufferKey } from "@/lib/store";
import type { Post, Settings } from "@/lib/types";

// Sends (or re-sends) a post's schedule to Buffer. Mutates `post` in place.
// With no Buffer channel set up, the post is still scheduled locally and a warning is returned.
export async function pushSchedule(settings: Settings, post: Post): Promise<{ error?: string; warning?: string }> {
  if (!post.scheduledAt) return { error: "Pick a date and time first." };
  if (new Date(post.scheduledAt) < new Date()) return { error: "That time is in the past — pick a future slot." };
  const key = bufferKey(settings);
  const goingToBuffer = !!key && (!!post.bufferPostId || !!settings.bufferChannelId);
  let imageUrls: string[] = [];
  if (goingToBuffer) {
    try {
      imageUrls = await ensurePublicImages(post.images);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Couldn't upload the image." };
    }
  }
  try {
    if (post.bufferPostId && key) {
      await editScheduledPost(key, post.bufferPostId, post.text, post.scheduledAt, imageUrls);
    } else if (key && settings.bufferChannelId) {
      const created = await createScheduledPost(key, settings.bufferChannelId, post.text, post.scheduledAt, imageUrls);
      post.bufferPostId = created.id;
    } else {
      post.status = "scheduled";
      return { warning: "Saved to your calendar only — connect Buffer in Settings to auto-publish." };
    }
    post.status = "scheduled";
    post.error = null;
    return {};
  } catch (e) {
    return { error: e instanceof BufferError ? e.message : "Couldn't reach Buffer." };
  }
}

export async function pullFromBuffer(settings: Settings, post: Post): Promise<{ error?: string }> {
  const key = bufferKey(settings);
  if (post.bufferPostId && key) {
    try {
      await deletePost(key, post.bufferPostId);
    } catch (e) {
      return { error: e instanceof BufferError ? e.message : "Couldn't reach Buffer." };
    }
  }
  post.bufferPostId = null;
  return {};
}
