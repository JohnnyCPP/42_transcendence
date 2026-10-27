'use client';

import { useContext } from 'react';
import { OrgContext } from './OrgProvider';

/**
 * Hook consumidor del estado de organizaciones (= workspace en UI).
 *
 * No guarda estado propio: lee el valor compartido que reparte
 * `OrgProvider` a través de `OrgContext`.
 *
 * Debe usarse siempre dentro de un árbol envuelto por `OrgProvider`
 * (normalmente en el layout raíz de la app).
 *
 * `activeOrganization` es el workspace activo; los boards se filtran con él.
 */
export function useOrg() {
  const context = useContext(OrgContext);

  if (!context) {
    throw new Error('useOrg debe usarse dentro de OrgProvider');
  }

  return context;
}