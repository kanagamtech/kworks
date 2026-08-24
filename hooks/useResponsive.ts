import { useWindowDimensions } from 'react-native';

export type DeviceKind = 'mobile' | 'tablet' | 'desktop';

export function useResponsive() {
  const { width } = useWindowDimensions();

  const kind: DeviceKind = width >= 1024 ? 'desktop' : width >= 480 ? 'tablet' : 'mobile';

  const columns = kind === 'mobile' ? 2 : kind === 'tablet' ? 3 : 4;
  const contentMaxWidth = kind === 'desktop' ? 960 : 640;
  const cardAspect = kind === 'mobile' ? 1.05 : 1.25;
  const scale = kind === 'mobile' ? 1 : kind === 'tablet' ? 1.15 : 1.35;

  return { width, kind, columns, contentMaxWidth, cardAspect, scale, isDesktop: kind === 'desktop' };
}