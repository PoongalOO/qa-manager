export interface Comment {
  id: number;
  commentableType: string;
  commentableId: number;
  userId: number | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  User?: { id: number; username: string; email: string };
}
