interface IconProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

function base(size: number, strokeWidth: number) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
}

export function IconSearch({ size = 18, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  );
}

export function IconHeart({ size = 18, strokeWidth = 2.1, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base(size, strokeWidth)} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 20.3 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 0 1 19.4 13Z" />
    </svg>
  );
}

export function IconHome({ size = 20, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M3 10.5 12 3.5l9 7" />
      <path d="M5.5 9.8V20a.8.8 0 0 0 .8.8h11.4a.8.8 0 0 0 .8-.8V9.8" />
      <path d="M9.6 20.8v-5.4h4.8v5.4" />
    </svg>
  );
}

export function IconGrid({ size = 20, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </svg>
  );
}

export function IconPlus({ size = 26, strokeWidth = 2.4 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconUser({ size = 20, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

export function IconPlay({ size = 20, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} fill="currentColor" stroke="none">
      <path d="M8 5.2v13.6a.8.8 0 0 0 1.22.68l11-6.8a.8.8 0 0 0 0-1.36l-11-6.8A.8.8 0 0 0 8 5.2Z" />
    </svg>
  );
}

export function IconVideo({ size = 16, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <rect x="2.5" y="6" width="13" height="12" rx="2.5" />
      <path d="m15.5 10.5 6-3.2v9.4l-6-3.2Z" />
    </svg>
  );
}

export function IconEye({ size = 15, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

export function IconCheck({ size = 16, strokeWidth = 2.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

export function IconShield({ size = 14, strokeWidth = 2.2 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M12 2.8 4.5 6v6c0 4.6 3.1 8.2 7.5 9.2 4.4-1 7.5-4.6 7.5-9.2V6Z" />
      <path d="m8.8 12 2.3 2.3 4.1-4.6" />
    </svg>
  );
}

export function IconPin({ size = 14, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M12 21.5s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10.2" r="2.6" />
    </svg>
  );
}

export function IconClose({ size = 18, strokeWidth = 2.3 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconArrow({ size = 16, strokeWidth = 2.3 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconChevron({ size = 15, strokeWidth = 2.3 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function IconFilter({ size = 17, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M3 6h18M6.5 12h11M10 18h4" />
    </svg>
  );
}

export function IconPhone({ size = 17, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M6.2 3.5h3l1.5 4-2 1.4a12.5 12.5 0 0 0 6.4 6.4l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A17.5 17.5 0 0 1 4.2 5.7a2 2 0 0 1 2-2.2Z" />
    </svg>
  );
}

export function IconChat({ size = 17, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M20.5 12c0 4.1-3.8 7.4-8.5 7.4a10 10 0 0 1-2.8-.4L4.5 20.5l1.3-3.6A7 7 0 0 1 3.5 12c0-4.1 3.8-7.4 8.5-7.4s8.5 3.3 8.5 7.4Z" />
    </svg>
  );
}

export function IconLock({ size = 15, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
    </svg>
  );
}

export function IconShare({ size = 17, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <circle cx="18" cy="5.5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="18.5" r="2.5" />
      <path d="m8.2 10.8 7.6-4M8.2 13.2l7.6 4" />
    </svg>
  );
}

export function IconSun({ size = 19, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.5 1.5M17.3 17.3l1.5 1.5M18.8 5.2l-1.5 1.5M6.7 17.3l-1.5 1.5" />
    </svg>
  );
}

export function IconMoon({ size = 19, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M20 13.5A8.5 8.5 0 0 1 10.5 4a8.5 8.5 0 1 0 9.5 9.5Z" />
    </svg>
  );
}

export function IconSettings({ size = 18, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 14.4a1.6 1.6 0 0 0 .32 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-1 1.47V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.47 1.6 1.6 0 0 0-1.77.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.47-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.47-1 1.6 1.6 0 0 0-.32-1.77l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.6 1.6 0 0 0 1.77.32H9a1.6 1.6 0 0 0 1-1.47V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.47 1.6 1.6 0 0 0 1.77-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.6 1.6 0 0 0-.32 1.77V9a1.6 1.6 0 0 0 1.47 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1.4Z" />
    </svg>
  );
}

export function IconChart({ size = 18, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}

export function IconStore({ size = 18, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M3.5 9.5 5 4h14l1.5 5.5a3 3 0 0 1-5.7 1.6 3 3 0 0 1-5.6 0 3 3 0 0 1-5.7-1.6Z" />
      <path d="M5 11.6V20h14v-8.4M10 20v-5h4v5" />
    </svg>
  );
}

export function IconLink({ size = 15, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M10 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 1 0-5.7-5.7l-1.3 1.3" />
      <path d="M14 10.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.3-1.3" />
    </svg>
  );
}

export function IconCopy({ size = 15, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <rect x="9" y="9" width="11.5" height="11.5" rx="2.5" />
      <path d="M15 6.2V5.8A2.3 2.3 0 0 0 12.7 3.5H5.8A2.3 2.3 0 0 0 3.5 5.8v6.9A2.3 2.3 0 0 0 5.8 15h.4" />
    </svg>
  );
}

export function IconTrash({ size = 15, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M4 6.5h16M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
      <path d="M6.5 6.5 7.4 20a1.3 1.3 0 0 0 1.3 1.2h6.6a1.3 1.3 0 0 0 1.3-1.2l.9-13.5" />
    </svg>
  );
}

export function IconUpload({ size = 17, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M12 16V4M7.5 8.5 12 4l4.5 4.5" />
      <path d="M4 15v3.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V15" />
    </svg>
  );
}

export function IconSpark({ size = 15, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M12 3.5 13.7 9l5.8 1.7-5.8 1.8L12 18l-1.7-5.5L4.5 10.7 10.3 9Z" />
      <path d="M18.5 3.5v3M20 5h-3" />
    </svg>
  );
}

export function IconTag({ size = 15, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M3.5 11V4.5a1 1 0 0 1 1-1H11l9 9-7.5 7.5Z" />
      <circle cx="7.8" cy="7.8" r="1.4" />
    </svg>
  );
}

export function IconClock({ size = 14, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.2l3.2 2" />
    </svg>
  );
}

export function IconWallet({ size = 18, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M3.5 7.5A2 2 0 0 1 5.5 5.5h11a2 2 0 0 1 2 2" />
      <rect x="3.5" y="7.5" width="17" height="11.5" rx="2.5" />
      <circle cx="16" cy="13.2" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconBookmark({ size = 18, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4.2L5.5 20.5v-16a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

export function IconLayers({ size = 18, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="m12 3 9 4.7-9 4.7-9-4.7Z" />
      <path d="m3 12.4 9 4.7 9-4.7M3 17l9 4.7 9-4.7" />
    </svg>
  );
}

export function IconMegaphone({ size = 18, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M4 10v4a2 2 0 0 0 2 2h1.5l8.5 4.5V5.5L7.5 10Z" />
      <path d="M19 9.5a3.4 3.4 0 0 1 0 5" />
    </svg>
  );
}

export function IconUsers({ size = 18, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <circle cx="9" cy="8" r="3.6" />
      <path d="M2.8 20a6.2 6.2 0 0 1 12.4 0" />
      <path d="M16 5.2a3.6 3.6 0 0 1 0 6.6M17.5 14.4A6.2 6.2 0 0 1 21.2 20" />
    </svg>
  );
}

export function IconList({ size = 18, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12M4 6.5h.01M4 12h.01M4 17.5h.01" />
    </svg>
  );
}

export function IconFlame({ size = 15, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M12 21c3.6 0 6-2.4 6-5.6 0-3.9-3.4-5.5-3.4-9.4-2 .8-3 2.6-3 4.4-1-.6-1.6-1.8-1.6-3C7.6 8.6 6 11 6 15.4 6 18.6 8.4 21 12 21Z" />
    </svg>
  );
}

export function IconMuted({ size = 20, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M4 9.5v5a1 1 0 0 0 1 1h2.6L12 19.4V4.6L7.6 8.5H5a1 1 0 0 0-1 1Z" />
      <path d="m16.5 9.5 4 5M20.5 9.5l-4 5" />
    </svg>
  );
}

export function IconUnmuted({ size = 20, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M4 9.5v5a1 1 0 0 0 1 1h2.6L12 19.4V4.6L7.6 8.5H5a1 1 0 0 0-1 1Z" />
      <path d="M15.6 9a4.2 4.2 0 0 1 0 6M18.2 6.6a7.6 7.6 0 0 1 0 10.8" />
    </svg>
  );
}

export function IconSend({ size = 18, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M21 3 10.5 13.5M21 3l-6.8 18-3.7-7.5L3 9.8Z" />
    </svg>
  );
}

export function IconImage({ size = 17, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <circle cx="8.6" cy="10" r="1.6" />
      <path d="m3.6 17.5 4.8-4.6 3.4 3.2 3-2.8 5.6 5" />
    </svg>
  );
}

export function IconPlayCircle({ size = 18, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10.2 8.8v6.4l5-3.2Z" fill="currentColor" />
    </svg>
  );
}

export function IconPause({ size = 18, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 9v6M14 9v6" />
    </svg>
  );
}

export function IconLoop({ size = 17, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M4 9.5A4.5 4.5 0 0 1 8.5 5h9M20 14.5A4.5 4.5 0 0 1 15.5 19h-9" />
      <path d="m14.5 2.5 3 2.5-3 2.5M9.5 16.5 6.5 19l3 2.5" />
    </svg>
  );
}

export function IconType({ size = 17, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M4 6.5V4.5h16v2M12 4.5v15M8.5 19.5h7" />
    </svg>
  );
}

export function IconMusic({ size = 17, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M9 18V5.5l11-2V16" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </svg>
  );
}

export function IconFilm({ size = 17, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="M7 4.5v15M17 4.5v15M2.5 12h19M2.5 8.2h4.5M2.5 15.8h4.5M17 8.2h4.5M17 15.8h4.5" />
    </svg>
  );
}

export function IconBadge({ size = 16, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="m12 2.8 2.5 1.9 3.1-.3 1 3 2.6 1.8-1.3 2.9 1.3 2.9-2.6 1.8-1 3-3.1-.3L12 21.2 9.5 19.3l-3.1.3-1-3-2.6-1.8 1.3-2.9-1.3-2.9 2.6-1.8 1-3 3.1.3Z" />
      <path d="m9 12 2.2 2.2L15.4 10" />
    </svg>
  );
}
