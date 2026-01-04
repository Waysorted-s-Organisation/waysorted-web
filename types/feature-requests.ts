export interface Attachment {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
}

export interface FeatureRequest {
  _id: string;
  title: string;
  description?: string;
  type?: string;
  board?: string;
  attachments: Attachment[];
  status: string;
  authorId: string;
  authorName?: string;
  votes?: number;
  votedBy?: string[];
  reports?: { reporterId: string; reason: string; createdAt?: string }[];
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  commentsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RequestComment {
  _id: string;
  featureId: string;
  parent?: string | null;
  authorId: string;
  authorName?: string;
  text: string;
  attachments: Attachment[];
  likes?: number;
  likedBy?: string[];
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  reports?: { reporterId: string; reason: string; createdAt?: string }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRequestInput {
  title: string;
  description?: string;
  type?: string;
  board?: string;
  attachments?: File[];
}

export interface CreateCommentInput {
  text: string;
  parent?: string | null;
  attachments?: File[];
}
export interface Notification {
  _id: string;
  recipientId: string;
  type: "vote" | "comment" | "status_change" | "mention" | "report";
  message: string;
  read: boolean;
  featureId?: string;
  commentId?: string;
  createdAt: string;
}
