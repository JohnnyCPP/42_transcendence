import type { PrismaClient } from '@prisma/client';
import { randomToken } from '../../shared/crypto/randomToken.js';
import type { Comment, CommentsRepository } from './comments.repository.js';

export class PrismaCommentsRepository implements CommentsRepository {
  constructor(private readonly prisma: PrismaClient) {}
  list(cardId: string): Promise<Comment[]> {
    return this.prisma.comment.findMany({ where: { cardId, deletedAt: null }, orderBy: { createdAt: 'asc' } });
  }
  findById(id: string): Promise<Comment | null> {
    return this.prisma.comment.findFirst({ where: { id, deletedAt: null } });
  }
  create(cardId: string, authorId: string, content: string): Promise<Comment> {
    return this.prisma.comment.create({ data: { id: randomToken(16), cardId, authorId, content } });
  }
  async update(id: string, content: string): Promise<Comment | null> {
    const result = await this.prisma.comment.updateMany({ where: { id, deletedAt: null }, data: { content } });
    return result.count ? this.findById(id) : null;
  }
  async delete(id: string): Promise<boolean> {
    const result = await this.prisma.comment.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
    return result.count === 1;
  }
}
