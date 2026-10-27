/**
 * Props para controlar el sidebar en mobile.
 */
export interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

/**
 * Props de un enlace de navegación del sidebar.
 */
export interface NavItemProps {
  href: string;
  icon: string;
  label: string;
  active: boolean;
  onClick?: () => void;
  fill?: boolean;
}
