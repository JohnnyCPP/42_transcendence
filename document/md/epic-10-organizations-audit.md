# Epic 10 — organization requirements audit

Story: [10.1 — audit the organization module](https://github.com/JohnnyCPP/42_transcendence/issues/81)  
Scope: repository state at commit `69f265d`. In the UI, an organization is called a **workspace**.

This assessment is based on source inspection and the existing integration tests. It is not a new browser or end-to-end test run. **Present** means the requirement has an implementation at the stated scope; **Partial** means an implementation exists but a gap remains; **Missing** means no implementation was found.

| Requirement | Status | Evidence and specific gaps |
| --- | --- | --- |
| Create organization | Present | `POST /api/v1/organizations` is authenticated and [`createWithOwner`](../../src/modules/organizations/organizations.prismaRepository.ts) creates the organization and owner membership in a PostgreSQL transaction. The workspace page has a creation form. Confirm the complete browser flow; Swagger documents 201 while the handler currently returns the default 200. |
| Edit organization | Partial | The authenticated PATCH route and service enforce owner/admin and update name and slug; the workspace settings form calls it. The story asks for a description, but [`Organization`](../../prisma/schema.prisma) has no description field. The settings form does not hide the save action from members; verify its client state update and error handling in a browser. |
| Delete organization | Partial | The owner-only DELETE route archives the organization and the repositories exclude archived organizations from list and detail. The settings UI only simulates deletion: [`deleteOrganization`](../../frontend/components/org/OrgProvider.tsx) is a no-op. Refresh also creates an organization automatically when the returned list is empty, which must be considered when connecting deletion. |
| Add user to organization | Partial | The authenticated `PUT /api/v1/organizations/:organizationId/members/:userId` upserts a membership after role and active-user checks. There is no UI to find and add a user by username. Story 10.3 specifies a distinct POST and a conflict for existing members; the current PUT instead updates an existing membership. |
| Remove user from organization | Partial | The DELETE membership route and service enforce roles, reject removal of an owner and return 404 for a missing member. Prisma removes related board memberships in a transaction. The members component offers removal with confirmation, but the two-user browser flow and feedback still need verification. |
| View organizations (list) | Partial | Authenticated `GET /api/v1/organizations` returns paginated, non-archived memberships and the workspace page lists the results. [`OrgProvider`](../../frontend/components/org/OrgProvider.tsx) consumes only the first page and automatically creates an organization when the returned list is empty. Confirm behavior with more than one page and after removal from the last organization. |
| View one organization (detail) | Partial | Authenticated `GET /api/v1/organizations/:organizationId` checks membership and excludes archived organizations. The workspace UI shows the active organization and its members, but does not provide a dedicated detail route backed by this GET; verify the existing view against the story's role and action requirements. |
| Create, read and update within an organization | Partial | Board routes and services provide organization-scoped creation and listing, plus board read/update with role checks; list and card operations build on board access. The existing RBAC tests cover allowed and forbidden cases. A two-user browser demonstration of the complete flow is still needed. |

## Evidence and follow-up

- API, authorization and validation: [`organizations.routes.ts`](../../src/modules/organizations/organizations.routes.ts), [`organizations.service.ts`](../../src/modules/organizations/organizations.service.ts), and [`requireScopeRole.ts`](../../src/modules/authorization/requireScopeRole.ts). Some routes use the organization guard while others enforce membership or role in the service; story 10.4 asks for a consistent guard and negative coverage.
- UI: [`workspace/page.tsx`](../../frontend/app/workspace/page.tsx), [`WorkspaceSettingsPage.tsx`](../../frontend/components/org/WorkspaceSettingsPage.tsx), [`useWorkspaceSettings.ts`](../../frontend/components/org/useWorkspaceSettings.ts), and [`OrganizationMembers.tsx`](../../frontend/components/org/OrganizationMembers.tsx).
- Existing HTTP and PostgreSQL role tests: [`rbac.routes.test.ts`](../../test/integration/rbac.routes.test.ts) and [`rbac.postgres.test.ts`](../../test/integration/rbac.postgres.test.ts). They cover organization permissions and membership changes, but do not exercise the actual browser UI.
- The existing [`module_status.md`](module_status.md) says organization deletion and member removal are missing. Those backend operations now exist; the end-to-end gaps above are more specific.

Stories 10.2–10.6 cover the API, membership, permission, UI and demo gaps. They are not implemented by this audit.
