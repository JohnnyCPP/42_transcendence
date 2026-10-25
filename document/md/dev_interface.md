## Manual Development Interface

The interface served from `/` can currently exercise:

- Registration, login, two-factor login, session lookup, and logout.
- Reauthentication, password changes, TOTP setup, and TOTP removal.
- Organization, board, and list creation.
- Card creation, editing, movement, and archival.
- A live request log showing method, route, response status, duration, request data, and response data.

It does not expose every backend operation. Membership management and list reordering, for example, currently require direct API requests.

