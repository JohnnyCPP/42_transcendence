'use client';

import {
  ConfirmDialog,
  Icon,
  TextInputDialog,
  cx,
  uiStyles,
} from '@/components/ui';
import {
  useBoardActions,
  type UseBoardActionsOptions,
} from './useBoardActions';

interface BoardCardMenuBocadilloProps {
  isOpen: boolean;
  onRename: () => void;
  onDelete: () => void;
}

/**
 * Bocadillo del menú ⋯: acciones Renombrar / Eliminar.
 */
export function BoardCardMenuBocadillo({
  isOpen,
  onRename,
  onDelete,
}: BoardCardMenuBocadilloProps) {
  if (!isOpen) return null;

  return (
    <div
      role="menu"
      className="absolute right-0 top-full z-50 mt-2 min-w-44 overflow-hidden rounded-xl border border-outline-variant bg-white p-1 shadow-lg"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <button
        type="button"
        role="menuitem"
        className={uiStyles.dropdownItem}
        onClick={onRename}
      >
        <Icon name="edit" size="md" />
        Renombrar
      </button>
      <button
        type="button"
        role="menuitem"
        className={uiStyles.dropdownItemDanger}
        onClick={onDelete}
      >
        <Icon name="delete" size="md" />
        Eliminar
      </button>
    </div>
  );
}

/**
 * Callout temporal tras renombrar / intentar eliminar.
 */
export function BoardCardMenuNotice({
  notice,
  className,
}: {
  notice: string | null;
  className?: string;
}) {
  if (!notice) return null;

  return (
    <p
      className={cx(
        'absolute left-0 top-full z-10 mt-2 w-56 text-xs',
        uiStyles.infoCallout,
        className
      )}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {notice}
    </p>
  );
}

type BoardCardMenuProps = {
  boardId: string;
  boardName: string;
  /** Estilo del botón ⋯: card (default) o header del kanban. */
  variant?: 'card' | 'header';
} & UseBoardActionsOptions;

/**
 * Menú ⋯ compartido: cards y cabecera del kanban.
 *
 * La lógica vive en `useBoardActions` (una sola fuente de verdad).
 */
export function BoardCardMenu({
  boardId,
  boardName,
  onRenamed,
  variant = 'card',
}: BoardCardMenuProps) {
  const menu = useBoardActions(boardId, boardName, { onRenamed });

  const triggerClassName =
    variant === 'header'
      ? 'flex items-center gap-1.5 rounded bg-surface-container px-3 py-1.5 text-[12px] font-semibold text-on-surface transition-colors hover:bg-surface-container-high'
      : 'rounded-md p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface';

  return (
    <div className="relative" ref={menu.menuRef}>
      <button
        type="button"
        aria-label="Acciones del tablero"
        aria-expanded={menu.isOpen}
        aria-haspopup="menu"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          menu.setIsOpen((open) => !open);
          menu.setNotice(null);
        }}
        className={triggerClassName}
      >
        <Icon name="more_horiz" size="md" />
      </button>

      <BoardCardMenuBocadillo
        isOpen={menu.isOpen}
        onRename={menu.openRename}
        onDelete={menu.openDelete}
      />

      <BoardCardMenuNotice
        notice={menu.notice}
        className={variant === 'header' ? 'left-auto right-0 max-w-md' : undefined}
      />

      <TextInputDialog
        isOpen={menu.isRenameOpen}
        title="Renombrar tablero"
        description="La llamada usa el stub PATCH hasta que lo cables."
        label="Nombre"
        value={menu.renameValue}
        error={menu.renameError}
        onChange={menu.setRenameValue}
        onConfirm={() => {
          void menu.handleRename();
        }}
        onClose={() => menu.setIsRenameOpen(false)}
      />

      <ConfirmDialog
        isOpen={menu.isDeleteOpen}
        title="Eliminar tablero"
        description={`Vas a eliminar «${boardName || 'este tablero'}». El endpoint DELETE aún no existe; solo se valida el flujo de UI.`}
        confirmLabel="Eliminar"
        tone="danger"
        onConfirm={() => {
          void menu.handleDelete();
        }}
        onClose={() => menu.setIsDeleteOpen(false)}
      />
    </div>
  );
}
