import { notFound } from '../../shared/errors/httpErrors.js';
import type { BoardsService } from '../boards/boards.service.js';
import type { ListsRepository } from './lists.repository.js';
import type { BoardList, CreateListInput, ReorderListsInput, UpdateListInput } from './lists.types.js';

export class ListsService 
{
  constructor(
    private readonly listsRepository: ListsRepository,
    private readonly boardsService: BoardsService
  ) {}

  async createList(input: CreateListInput): Promise<BoardList> 
  {
    await this.boardsService.getBoardForUser(input.boardId, input.actorUserId);
    return this.listsRepository.create(input);
  }

  async listBoardLists(boardId: string, actorUserId: string): Promise<BoardList[]> 
  {
    await this.boardsService.getBoardForUser(boardId, actorUserId);
    return this.listsRepository.listForBoard(boardId);
  }

  async getListForUser(listId: string, actorUserId: string): Promise<BoardList> 
  {
    const list = await this.listsRepository.findById(listId);
    if (!list) throw notFound('List not found', 'LIST_NOT_FOUND');
    await this.boardsService.getBoardForUser(list.boardId, actorUserId);
    return list;
  }

  async updateList(input: UpdateListInput): Promise<BoardList> 
  {
    const list = await this.getListForUser(input.listId, input.actorUserId);
    return this.listsRepository.update({ ...input, listId: list.id });
  }

  async reorderLists(input: ReorderListsInput): Promise<BoardList[]> 
  {
    await this.boardsService.getBoardForUser(input.boardId, input.actorUserId);
    return this.listsRepository.reorder(input);
  }
}
