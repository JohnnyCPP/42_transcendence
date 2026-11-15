import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";

describe("POST /api-keys", () => {

	// the Awaited<ReturnType<...>> form is used because it's self-maintaining
	//
	// if buildApp changes its return type, the test's type automatically 
	// follows and the type doesn't need to be updated
	let	app: Awaited<ReturnType<typeof buildApp>>;

	beforeAll(async () => {

		app = await buildApp();
		await app.ready();
	});

	afterAll(async () => {

		await app.close();
	});

	// high-value integration test, it proves:
	//   - The route is registered (otherwise it would return 404)
	//   - requireAuth is applied (otherwise it would return 200 or 400)
	//   - The error shape matches the backend convention

	it("returns 401 without a session", async () => {

		const	res = await app.inject({

			method: "POST",
			url: "/api-keys",
			payload: { name: "x" },
		});

		expect(res.statusCode).toBe(401);
		expect(res.json()).toMatchObject({
			error: "UNAUTHORIZED",
			message: expect.any(String),
		});
	});

	it.skip("returns 400 with an invalid name when authenticated", async () =>
	{
		// TODO: Setup: create a user, log in, get the session cookie.
		//       The authenticated session is not ready yet.
		// ...
	});
});
