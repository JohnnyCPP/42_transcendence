export interface ActivityItem {
  icon: string;
  iconClassName: string;
  actor: string;
  action: string;
  highlight: string;
  context: string;
  time: string;
  previewText?: string;
  showConnector?: boolean;
}

interface BoardAvatar {
  src: string;
  alt: string;
}

export interface BoardCardProps {
  title: string;
  updatedText: string;
  label: string;
  href?: string;
  imageUrl: string;
  avatars: BoardAvatar[];
  progressPercent: number;
  labelClassName: string;
  progressClassName: string;
  imageOverlayClassName?: string;
  className?: string;
}

export interface DashboardHeroProps {
  title: string;
  subtitle: string;
}
