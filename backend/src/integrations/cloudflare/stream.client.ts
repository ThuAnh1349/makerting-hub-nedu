/**
 * Cloudflare Stream client.
 *
 * Handles video uploads to Cloudflare Stream via the tus resumable upload
 * protocol (recommended for large files) with a fallback to the simple
 * direct-upload URL for smaller blobs.
 *
 * Docs: https://developers.cloudflare.com/stream/uploading-videos/upload-video-file/
 */

import { env } from "../../shared/config/env.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StreamUploadResult {
  /** Cloudflare Stream video UID (used as a foreign key in our DB). */
  uid: string;
  /** Public thumbnail URL — available a few seconds after upload. */
  thumbnail_url: string;
  /** HLS manifest playback URL for the video player. */
  playback_url: string;
  /** Direct iframe embed URL for CMS use. */
  embed_url: string;
  /** ISO-8601 timestamp of upload creation on Cloudflare. */
  uploaded_at: string;
}

interface CloudflareStreamVideoResponse {
  result: {
    uid: string;
    thumbnail: string;
    playback: {
      hls: string;
      dash: string;
    };
    created: string;
    status: {
      state: string;
    };
  };
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
}

// ── Internal helpers ──────────────────────────────────────────────────────────

const STREAM_BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/stream`;

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
  };
}

/**
 * Derive a sensible filename from a Blob or File for the multipart form.
 */
function resolveBlobName(file: Blob): string {
  if (file instanceof File && file.name) {
    return file.name;
  }
  const ext =
    file.type === "video/mp4"
      ? ".mp4"
      : file.type === "video/webm"
      ? ".webm"
      : ".mp4";
  return `upload_${Date.now()}${ext}`;
}

/**
 * Build the full thumbnail URL for a Stream video.
 * Cloudflare returns a base thumbnail URL without protocol-relative prefix,
 * so we normalise it here.
 */
function buildThumbnailUrl(uid: string, rawThumbnail?: string): string {
  if (rawThumbnail && rawThumbnail.startsWith("http")) {
    return rawThumbnail;
  }
  return `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg?time=1s&height=360`;
}

/**
 * Build the HLS playback URL.
 */
function buildPlaybackUrl(uid: string, hls?: string): string {
  if (hls && hls.startsWith("http")) return hls;
  return `https://videodelivery.net/${uid}/manifest/video.m3u8`;
}

// ── Main upload function ───────────────────────────────────────────────────────

/**
 * Upload a video Blob to Cloudflare Stream.
 *
 * Uses the simple multipart form upload endpoint. For files >200 MB, consider
 * implementing the tus protocol via a separate `uploadVideoResumable()` function.
 *
 * The watermark profile UID from `CLOUDFLARE_STREAM_WATERMARK_UID` is applied
 * automatically when the env var is set.
 *
 * @param file - A Blob or File object containing the video data
 * @returns     Resolved URLs and metadata for the uploaded video
 * @throws      Error if the Cloudflare API returns a non-2xx response
 *
 * @example
 * const result = await uploadVideo(videoBlob);
 * // store result.uid, result.playback_url in DB
 */
export async function uploadVideo(file: Blob): Promise<StreamUploadResult> {
  const form = new FormData();
  form.append("file", file, resolveBlobName(file));

  // Apply watermark if configured.
  if (env.CLOUDFLARE_STREAM_WATERMARK_UID) {
    form.append(
      "watermark",
      JSON.stringify({ uid: env.CLOUDFLARE_STREAM_WATERMARK_UID })
    );
  }

  let response: globalThis.Response;
  try {
    response = await fetch(STREAM_BASE_URL, {
      method: "POST",
      headers: authHeaders(),
      body: form,
    });
  } catch (networkErr) {
    throw new Error(
      `[CloudflareStream] Network error during video upload: ${
        networkErr instanceof Error ? networkErr.message : String(networkErr)
      }`
    );
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "(unreadable body)");
    throw new Error(
      `[CloudflareStream] Upload failed with HTTP ${response.status}: ${errorText}`
    );
  }

  const data = (await response.json()) as CloudflareStreamVideoResponse;

  if (!data.success || !data.result) {
    const errorDetail =
      data.errors?.map((e) => `[${e.code}] ${e.message}`).join("; ") ??
      "Unknown Cloudflare error";
    throw new Error(
      `[CloudflareStream] API returned success=false: ${errorDetail}`
    );
  }

  const { uid, thumbnail, playback, created } = data.result;

  return {
    uid,
    thumbnail_url: buildThumbnailUrl(uid, thumbnail),
    playback_url: buildPlaybackUrl(uid, playback?.hls),
    embed_url: `https://iframe.videodelivery.net/${uid}`,
    uploaded_at: created ?? new Date().toISOString(),
  };
}

/**
 * Request a one-time direct upload URL from Cloudflare Stream.
 *
 * Use this when the client browser should upload directly to Cloudflare
 * without routing the binary through our API server (recommended for large
 * files to save bandwidth).
 *
 * @param options.maxDurationSeconds  Max video length in seconds (default 3600)
 * @param options.expiresAfterSeconds URL expiry window in seconds (default 3600)
 */
export async function createDirectUploadUrl(options?: {
  maxDurationSeconds?: number;
  expiresAfterSeconds?: number;
}): Promise<{ uploadUrl: string; uid: string }> {
  const payload = {
    maxDurationSeconds: options?.maxDurationSeconds ?? 3600,
    expiry: new Date(
      Date.now() + (options?.expiresAfterSeconds ?? 3600) * 1000
    ).toISOString(),
    ...(env.CLOUDFLARE_STREAM_WATERMARK_UID
      ? { watermark: { uid: env.CLOUDFLARE_STREAM_WATERMARK_UID } }
      : {}),
  };

  let response: globalThis.Response;
  try {
    response = await fetch(`${STREAM_BASE_URL}/direct_upload`, {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (networkErr) {
    throw new Error(
      `[CloudflareStream] Network error creating direct upload URL: ${
        networkErr instanceof Error ? networkErr.message : String(networkErr)
      }`
    );
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "(unreadable body)");
    throw new Error(
      `[CloudflareStream] Direct upload URL creation failed with HTTP ${response.status}: ${errorText}`
    );
  }

  const data = (await response.json()) as {
    result: { uploadURL: string; uid: string };
    success: boolean;
    errors: Array<{ code: number; message: string }>;
  };

  if (!data.success || !data.result) {
    throw new Error(
      `[CloudflareStream] API returned success=false for direct upload: ${
        data.errors?.map((e) => e.message).join("; ") ?? "unknown"
      }`
    );
  }

  return {
    uploadUrl: data.result.uploadURL,
    uid: data.result.uid,
  };
}

/**
 * Fetch the current processing status of an uploaded video.
 */
export async function getVideoStatus(
  uid: string
): Promise<{ state: string; pctComplete: string | null }> {
  const response = await fetch(`${STREAM_BASE_URL}/${uid}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      `[CloudflareStream] Failed to fetch video status for uid=${uid}: HTTP ${response.status}`
    );
  }

  const data = (await response.json()) as CloudflareStreamVideoResponse;

  return {
    state: data.result?.status?.state ?? "unknown",
    pctComplete: null, // Cloudflare doesn't expose % in v1 API
  };
}

/**
 * Delete a video from Cloudflare Stream.
 * Permanent — cannot be undone.
 */
export async function deleteVideo(uid: string): Promise<void> {
  const response = await fetch(`${STREAM_BASE_URL}/${uid}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(
      `[CloudflareStream] Failed to delete video uid=${uid}: HTTP ${response.status}`
    );
  }
}
