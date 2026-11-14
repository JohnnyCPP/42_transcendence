import { randomToken } from '../../shared/crypto/randomToken.js';

export type Comment = {
  id: string; cardId: string; authorId: string; content: string;
  createdAt: Date; updatedAt: Date; deletedAt: Date | null;
};

export interface CommentsRepository {
  list(cardId: string): Promise<Comment[]>;
  findById(id: string): Promise<Comment | null>;
  create(cardId: string, authorId: string, content: string): Promise<Comment>;
  update(id: string, content: string): Promise<Comment | null>;
  delete(id: string): Promise<boolean>;
}

export class InMemoryCommentsRepository implements CommentsRepository {
  private readonly comments = new Map<string, Comment>();

  async list(cardId: string): Promise<Comment[]> {
    return [...this.comments.values()].filter((item) => item.cardId === cardId && !item.deletedAt)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  async findById(id: string): Promise<Comment | null> {
    const item = this.comments.get(id);
    return item && !item.deletedAt ? item : null;
  }
  async create(cardId: string, authorId: string, content: string): Promise<Comment> {
    const now = new Date();
    const item = { id: randomToken(16), cardId, authorId, content, createdAt: now, updatedAt: now, deletedAt: null };
    this.comments.set(item.id, item);
    return item;
  }
  async update(id: string, content: string): Promise<Comment | null> {
    const item = await this.findById(id);
    if (!item) return null;
    item.content = content; item.updatedAt = new Date();
    return item;
  }
  async delete(id: string): Promise<boolean> {
    const item = await this.findById(id);
    if (!item) return false;
    item.deletedAt = new Date(); item.updatedAt = new Date();
    return true;
  }
}
