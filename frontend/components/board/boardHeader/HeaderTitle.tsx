'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui';

interface HeaderTitleProps {
  boardTitle: string | null;
}

/**
 * Título del board + favorito local (sin API).
 */
export function HeaderTitle({ boardTitle }: HeaderTitleProps) {
  const [isStarred, setIsStarred] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <h2 className="text-[32px] font-bold leading-none tracking-tight text-on-surface">
        {boardTitle ?? 'Cargando…'}
      </h2>
      <button
        type="button"
        onClick={() => setIsStarred(!isStarred)}
        className={`cursor-pointer transition-colors ${
          isStarred
            ? 'text-amber-500'
            : 'text-outline-variant hover:text-primary'
        }`}
        title="Marcar board como favorito"
      >
        <Icon name="star" filled={isStarred} />
      </button>
    </div>
  );
}
