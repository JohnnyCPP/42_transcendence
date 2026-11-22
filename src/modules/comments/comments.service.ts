import { notFound } from '../../shared/errors/httpErrors.js';
import type { CardsService } from '../cards/cards.service.js';
import type { CommentsRepository } from './comments.repository.js';

export class CommentsService {
  constructor(private readonly repository: CommentsRepository, private readonly cardsService: CardsService) {}

  async list(cardId: string, actorUserId: string) {
    await this.cardsService.getCardForUser(cardId, actorUserId);
    return this.repository.list(cardId);
  }
  async create(cardId: string, actorUserId: string, content: string) {
    await this.cardsService.getCardForUser(cardId, actorUserId, 'write');
    return this.repository.create(cardId, actorUserId, content);
  }
  async update(cardId: string, id: string, actorUserId: string, content: string) {
    await this.cardsService.getCardForUser(cardId, actorUserId, 'write');
    const item = await this.repository.findById(id);
    if (!item || item.cardId !== cardId) throw notFound('Comment not found', 'COMMENT_NOT_FOUND');
    const updated = await this.repository.update(id, content);
    if (!updated) throw notFound('Comment not found', 'COMMENT_NOT_FOUND');
    return updated;
  }
  async delete(cardId: string, id: string, actorUserId: string) {
    await this.cardsService.getCardForUser(cardId, actorUserId, 'write');
    const item = await this.repository.findById(id);
    if (!item || item.cardId !== cardId || !(await this.repository.delete(id)))
      throw notFound('Comment not found', 'COMMENT_NOT_FOUND');
  }
}
