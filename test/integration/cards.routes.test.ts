import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";

describe("card priority", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let listId: string;
  let cookie: string;

  // Build an authenticated owner and a board/list to exercise the HTTP routes.
  beforeAll(async () => {
    app = await buildApp();
    const user = await app.testContext.usersService.createUser({ username: "priority-owner" });
    const session = await app.testContext.sessionsService.createSession({ userId: user.id });
    cookie = `${process.env.SESSION_COOKIE_NAME ?? "sid"}=${session.token}`;
    const org = await app.testContext.organizationsService.createOrganization({ name: "Priority org", createdByUserId: user.id });
    const boardResponse = await app.inject({ method: "POST", url: `/organizations/${org.id}/boards`, headers: { cookie }, payload: { name: "Board" } });
    const listResponse = await app.inject({ method: "POST", url: `/boards/${boardResponse.json().board.id}/lists`, headers: { cookie }, payload: { name: "List" } });
    listId = listResponse.json().list.id;
  });
  afterAll(async () => { await app.close(); });

  it("creates, updates and reloads a priority, rejecting invalid values", async () => {
    // Creation and editing must return the selected priority, and listing must retain it.
    const create = await app.inject({ method: "POST", url: `/lists/${listId}/cards`, headers: { cookie }, payload: { title: "Task", priority: "Urgent" } });
    expect(create.statusCode).toBe(200);
    expect(create.json().card.priority).toBe("Urgent");
    const cardId = create.json().card.id;
    const update = await app.inject({ method: "PATCH", url: `/cards/${cardId}`, headers: { cookie }, payload: { priority: "Enhancement" } });
    expect(update.json().card.priority).toBe("Enhancement");
    const list = await app.inject({ method: "GET", url: `/lists/${listId}/cards`, headers: { cookie } });
    expect(list.json().cards[0].priority).toBe("Enhancement");
    // An unsupported priority is rejected without changing the saved value.
    const invalid = await app.inject({ method: "PATCH", url: `/cards/${cardId}`, headers: { cookie }, payload: { priority: "invalid" } });
    expect(invalid.statusCode).toBe(400);
    const read = await app.inject({ method: "GET", url: `/cards/${cardId}`, headers: { cookie } });
    expect(read.json().card.priority).toBe("Enhancement");
    // Existing clients that omit priority still receive the Low default.
    const defaultCard = await app.inject({ method: "POST", url: `/lists/${listId}/cards`, headers: { cookie }, payload: { title: "Existing default" } });
    expect(defaultCard.json().card.priority).toBe("Low");
  });
});
