/**
 * Post module business logic.
 *
 * Implements:
 *  - createPost
 *  - updatePost  (draft/rejected only; staff can only edit their own)
 *  - performAction  (state machine: submit_review → approve/reject → schedule)
 *  - uploadMedia   (image/video validation + Cloudflare upload)
 */

import {
  ConflictError,
  NotFoundError,
  BadRequestError,
} from "../../shared/middleware/error.handler.js";
import { auditPostApproval } from "../../shared/utils/audit.js";
import { uploadVideo } from "../../integrations/cloudflare/stream.client.js";
import { createNotification } from "../notification/notification.service.js";
import type { Post, PostMedia, PostStatus } from "./post.types.js";
import type { CreatePostInput, UpdatePostInput, PostActionInput } from "./post.schema.js";
import * as repo from "./post.repository.js";
import { env } from "../../shared/config/env.js";

// ── Constants ─────────────────────────────────────────────────────────────────

const MANAGEMENT_ROLES = ["co_leader", "marketing_leader", "admin", "super_admin"];
const APPROVED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const APPROVED_VIDEO_TYPES = new Set(["video/mp4", "video/quicktime"]);
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;   // 10 MB
const VIDEO_MAX_BYTES = 500 * 1024 * 1024;  // 500 MB

// ── findPosts (pass-through to repo) ─────────────────────────────────────────

export async function findPosts(
  userId: string,
  roles: string[],
  filters: import("./post.types.js").PostFilters
): Promise<{ rows: import("./post.types.js").Post[]; total: number }> {
  return repo.findPosts(userId, roles, filters);
}

// ── getPostById (pass-through to repo) ───────────────────────────────────────

export async function getPostById(
  postId: string,
  userId: string,
  roles: string[]
): Promise<import("./post.types.js").Post | null> {
  return repo.findPostById(postId, userId, roles);
}

// ── createPost ────────────────────────────────────────────────────────────────

export async function createPost(
  authorId: string,
  data: CreatePostInput
): Promise<Post> {
  return repo.createPost(authorId, {
    caption: data.caption,
    channel_codes: data.channel_codes,
    reference_links: data.reference_links ?? [],
    campaign_id: data.campaign_id,
    scheduled_at: data.scheduled_at,
  });
}

// ── updatePost ────────────────────────────────────────────────────────────────

export async function updatePost(
  postId: string,
  userId: string,
  roles: string[],
  data: UpdatePostInput
): Promise<Post> {
  const isManager = roles.some((r) => MANAGEMENT_ROLES.includes(r));

  const currentStatus = await repo.getPostCurrentStatus(postId);
  if (currentStatus === null) {
    throw new NotFoundError("Post", postId);
  }

  if (currentStatus !== "draft" && currentStatus !== "rejected") {
    throw new ConflictError("POST_NOT_EDITABLE", {
      current_status: currentStatus,
      message: "Only posts in 'draft' or 'rejected' status can be edited.",
    });
  }

  // Staff can only edit their own posts
  if (!isManager) {
    const authorId = await repo.getPostAuthorId(postId);
    if (authorId !== userId) {
      throw new NotFoundError("Post", postId); // 404 to avoid enumeration
    }
  }

  await repo.updatePost(postId, data);

  // If editing a rejected post, revert status to draft
  if (currentStatus === "rejected") {
    await repo.updatePostStatus(postId, "draft", { latest_approval_note: null });
  }

  const updated = await repo.findPostById(postId, userId, roles);
  if (!updated) throw new NotFoundError("Post", postId);
  return updated;
}

// ── performAction ─────────────────────────────────────────────────────────────

export async function performAction(
  postId: string,
  actorId: string,
  roles: string[],
  action: PostActionInput
): Promise<Post> {
  const isManager = roles.some((r) => MANAGEMENT_ROLES.includes(r));

  const currentStatus = await repo.getPostCurrentStatus(postId);
  if (currentStatus === null) {
    throw new NotFoundError("Post", postId);
  }

  switch (action.action_type) {
    case "submit_review": {
      if (currentStatus !== "draft" && currentStatus !== "rejected") {
        throw new ConflictError("POST_NOT_EDITABLE", {
          current_status: currentStatus,
          message: "Only draft or rejected posts can be submitted for review.",
        });
      }

      // Staff can only submit their own posts
      if (!isManager) {
        const authorId = await repo.getPostAuthorId(postId);
        if (authorId !== userId_from_actorId(actorId)) {
          throw new NotFoundError("Post", postId);
        }
      }

      await repo.updatePostStatus(postId, "pending_review");

      await auditPostApproval({
        post_id: postId,
        actor_person_id: actorId,
        decision: "submitted",
        comment: null,
      });

      // Notify all co_leaders and marketing_leaders
      const [coLeaders, marketingLeaders] = await Promise.all([
        repo.getPersonsByRole("co_leader"),
        repo.getPersonsByRole("marketing_leader"),
      ]);

      const recipients = [
        ...coLeaders,
        ...marketingLeaders,
      ].filter((p) => p.id !== actorId);

      const uniqueRecipients = Array.from(
        new Map(recipients.map((r) => [r.id, r])).values()
      );

      await Promise.all(
        uniqueRecipients.map((r) =>
          createNotification(
            r.id,
            "post_submitted",
            "normal",
            "Bài viết mới cần duyệt",
            "Có bài viết mới đang chờ bạn phê duyệt.",
            "post",
            postId
          )
        )
      );
      break;
    }

    case "approve": {
      if (!isManager) {
        throw new ConflictError("INSUFFICIENT_ROLE", {
          message: "Only co_leader or marketing_leader can approve posts.",
        });
      }

      if (currentStatus !== "pending_review") {
        throw new ConflictError("POST_NOT_PENDING_REVIEW", {
          current_status: currentStatus,
          message: "Only posts in 'pending_review' status can be approved.",
        });
      }

      const notes = action.notes ?? null;

      await repo.updatePostStatus(postId, "approved", {
        latest_approval_note: notes,
      });

      await auditPostApproval({
        post_id: postId,
        actor_person_id: actorId,
        decision: "approved",
        comment: notes,
      });

      // Notify the post author
      const authorId = await repo.getPostAuthorId(postId);
      if (authorId) {
        await createNotification(
          authorId,
          "post_approved",
          "normal",
          "Bài viết đã được duyệt",
          "Bài viết của bạn đã được phê duyệt thành công.",
          "post",
          postId
        );
      }
      break;
    }

    case "reject": {
      if (!isManager) {
        throw new ConflictError("INSUFFICIENT_ROLE", {
          message: "Only co_leader or marketing_leader can reject posts.",
        });
      }

      if (currentStatus !== "pending_review") {
        throw new ConflictError("POST_NOT_PENDING_REVIEW", {
          current_status: currentStatus,
          message: "Only posts in 'pending_review' status can be rejected.",
        });
      }

      await repo.updatePostStatus(postId, "rejected", {
        latest_approval_note: action.notes,
      });

      await auditPostApproval({
        post_id: postId,
        actor_person_id: actorId,
        decision: "rejected",
        comment: action.notes,
      });

      // Notify the post author
      const authorId = await repo.getPostAuthorId(postId);
      if (authorId) {
        await createNotification(
          authorId,
          "post_rejected",
          "high",
          "Bài viết bị từ chối",
          `Bài viết của bạn bị từ chối: ${action.notes}`,
          "post",
          postId
        );
      }
      break;
    }

    case "schedule": {
      if (currentStatus !== "approved") {
        throw new ConflictError("POST_NOT_APPROVED", {
          current_status: currentStatus,
          message: "Only approved posts can be scheduled.",
        });
      }

      const scheduledAt = action.scheduled_at;
      if (new Date(scheduledAt) <= new Date()) {
        throw new BadRequestError("scheduled_at must be a future datetime.");
      }

      await repo.updatePostStatus(postId, "scheduled", {
        scheduled_at: scheduledAt,
      });

      await auditPostApproval({
        post_id: postId,
        actor_person_id: actorId,
        decision: "revision_requested", // closest available type in audit for scheduling
        comment: `Scheduled for: ${scheduledAt}`,
        metadata: { scheduled_at: scheduledAt },
      });
      // No notification for schedule action per spec
      break;
    }
  }

  const updated = await repo.findPostById(postId, actorId, roles);
  if (!updated) throw new NotFoundError("Post", postId);
  return updated;
}

/**
 * Tiny helper used to resolve actorId to check against authorId.
 * The actorId IS the person.id — no translation needed.
 */
function userId_from_actorId(actorId: string): string {
  return actorId;
}

// ── uploadMedia ───────────────────────────────────────────────────────────────

export async function uploadMedia(
  postId: string,
  userId: string,
  roles: string[],
  file: Blob,
  filename: string,
  contentType: string
): Promise<PostMedia> {
  const isManager = roles.some((r) => MANAGEMENT_ROLES.includes(r));

  // Confirm post exists and user has access
  const currentStatus = await repo.getPostCurrentStatus(postId);
  if (currentStatus === null) {
    throw new NotFoundError("Post", postId);
  }

  if (!isManager) {
    const authorId = await repo.getPostAuthorId(postId);
    if (authorId !== userId) {
      throw new NotFoundError("Post", postId);
    }
  }

  // Determine media type
  const isVideo = contentType.startsWith("video/");
  const isImage = contentType.startsWith("image/");

  if (!isVideo && !isImage) {
    throw new BadRequestError(
      `Unsupported content type: ${contentType}. Accepted: image/jpeg, image/png, image/webp, video/mp4, video/quicktime.`
    );
  }

  if (isImage && !APPROVED_IMAGE_TYPES.has(contentType)) {
    throw new BadRequestError(
      `Unsupported image type: ${contentType}. Accepted: image/jpeg, image/png, image/webp.`
    );
  }

  if (isVideo && !APPROVED_VIDEO_TYPES.has(contentType)) {
    throw new BadRequestError(
      `Unsupported video type: ${contentType}. Accepted: video/mp4, video/quicktime.`
    );
  }

  const fileSize = file.size;
  if (isImage && fileSize > IMAGE_MAX_BYTES) {
    throw new BadRequestError(
      `Image too large: ${(fileSize / 1024 / 1024).toFixed(1)} MB. Maximum allowed is 10 MB.`
    );
  }
  if (isVideo && fileSize > VIDEO_MAX_BYTES) {
    throw new BadRequestError(
      `Video too large: ${(fileSize / 1024 / 1024).toFixed(1)} MB. Maximum allowed is 500 MB.`
    );
  }

  const mediaType: "image" | "video" = isVideo ? "video" : "image";
  const sortOrder = (await repo.getPostMediaCount(postId)) + 1;

  let url: string;
  let thumbnailUrl: string | null = null;
  let durationSeconds: number | null = null;

  if (isVideo) {
    // Upload to Cloudflare Stream
    const streamResult = await uploadVideo(file);
    url = streamResult.playback_url;
    thumbnailUrl = streamResult.thumbnail_url;
    // Duration not available immediately from Cloudflare Stream upload response
    durationSeconds = null;
  } else {
    // Upload image to Cloudflare Images
    url = await uploadImageToCloudflare(file, filename, contentType);
    thumbnailUrl = null;
  }

  return repo.insertMedia(postId, {
    media_type: mediaType,
    url,
    thumbnail_url: thumbnailUrl,
    duration_seconds: durationSeconds,
    sort_order: sortOrder,
  });
}

/**
 * Upload an image to Cloudflare Images API.
 * Returns the CDN delivery URL.
 */
async function uploadImageToCloudflare(
  file: Blob,
  filename: string,
  contentType: string
): Promise<string> {
  const form = new FormData();
  form.append("file", file, filename);

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      },
      body: form,
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "(unreadable)");
    throw new Error(
      `[CloudflareImages] Upload failed with HTTP ${response.status}: ${errorText}`
    );
  }

  const data = (await response.json()) as {
    result: { variants: string[] };
    success: boolean;
    errors: Array<{ message: string }>;
  };

  if (!data.success || !data.result?.variants?.[0]) {
    throw new Error(
      `[CloudflareImages] Upload failed: ${data.errors?.map((e) => e.message).join("; ") ?? "unknown"}`
    );
  }

  return data.result.variants[0];
}
