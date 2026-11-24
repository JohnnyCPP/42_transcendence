# Organizations demo

Allow three minutes for this walkthrough. It uses two independent browser sessions and shows how an owner manages an organization and what a member can see and do.

## Prepare

- Open TaskFlow in two browsers or separate browser profiles so each session has its own login.
- Create the account for User B beforehand and note its username. Keep B signed out until step 3.
- Have an unused username ready for User A and a unique name for the demo organization.

## Walkthrough

| Step | Action | Expected result |
| --- | --- | --- |
| 1 | Register as User A. Open **Workspace**, enter the organization name and click **Crear organización**. Return to **Workspace**. | The organization appears as the active workspace and A is listed as its owner. |
| 2 | As A, open **Ajustes del workspace**. Enter B's username under **Añadir miembro**, select **Miembro** and click **Añadir al workspace**. | B appears in the member list with the **Miembro** role. |
| 3 | In the second browser, sign in as B. Open **Workspace**, select the organization and open **Ajustes del workspace**. | B can see the organization and its members. The settings are read-only, and the actions for deleting the workspace and adding members are absent. |
| 4 | As A, change the organization name and click **Guardar cambios**. Reload the settings page as B. | A sees “Workspace actualizado.” and B sees the new name. |
| 5 | As A, click **Retirar** on B's row and confirm. As B, open **Workspace** and reload. | B disappears from A's member list, and the organization disappears from B's workspace list. |
| 6 | As A, check your own row in the member list for the **Retirar** action. | The row has no removal action and displays “El propietario no se puede retirar ni cambiar de rol.” |

The walkthrough was completed in under three minutes during manual verification.
