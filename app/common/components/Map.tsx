'use client';

import MapLibreGL, { type MapLayerMouseEvent, type MarkerOptions } from 'maplibre-gl';
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

const defaultStyles = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
};

type Theme = 'light' | 'dark';

function getDocumentTheme(): Theme | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const theme = document.documentElement.dataset.webtuiTheme;

  if (theme?.includes('dark') || theme === 'nord' || theme === 'osmium') {
    return 'dark';
  }

  if (theme?.includes('light')) {
    return 'light';
  }

  return null;
}

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function useResolvedTheme(themeProp?: Theme): Theme {
  const [detectedTheme, setDetectedTheme] = useState<Theme>(
    () => getDocumentTheme() ?? getSystemTheme(),
  );

  useEffect(() => {
    if (themeProp) {
      return;
    }

    const observer = new MutationObserver(() => {
      const documentTheme = getDocumentTheme();

      if (documentTheme) {
        setDetectedTheme(documentTheme);
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-webtui-theme'],
    });

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (event: MediaQueryListEvent) => {
      if (!getDocumentTheme()) {
        setDetectedTheme(event.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleSystemChange);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', handleSystemChange);
    };
  }, [themeProp]);

  return themeProp ?? detectedTheme;
}

export type MapViewport = {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
};

type MapStyleOption = string | MapLibreGL.StyleSpecification;

type MapContextValue = {
  isLoaded: boolean;
  map: MapLibreGL.Map | null;
  resolvedTheme: Theme;
};

const MapContext = createContext<MapContextValue | null>(null);

export function useMap() {
  const context = useContext(MapContext);

  if (!context) {
    throw new Error('useMap must be used within a Map component');
  }

  return context;
}

function getViewport(map: MapLibreGL.Map): MapViewport {
  const center = map.getCenter();

  return {
    bearing: map.getBearing(),
    center: [center.lng, center.lat],
    pitch: map.getPitch(),
    zoom: map.getZoom(),
  };
}

type MapProps = {
  children?: ReactNode;
  className?: string;
  loading?: boolean;
  onClick?: (event: MapLayerMouseEvent) => void;
  onViewportChange?: (viewport: MapViewport) => void;
  styles?: {
    dark?: MapStyleOption;
    light?: MapStyleOption;
  };
  theme?: Theme;
  viewport?: Partial<MapViewport>;
} & Omit<MapLibreGL.MapOptions, 'container' | 'style'>;

function DefaultLoader() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[color-mix(in_srgb,var(--background0)_54%,transparent)] backdrop-blur-xs">
      <div className="flex gap-1">
        <span className="size-1.5 animate-pulse rounded-full bg-[var(--subtext0)]" />
        <span className="size-1.5 animate-pulse rounded-full bg-[var(--subtext0)] [animation-delay:150ms]" />
        <span className="size-1.5 animate-pulse rounded-full bg-[var(--subtext0)] [animation-delay:300ms]" />
      </div>
    </div>
  );
}

export const Map = forwardRef<MapLibreGL.Map, MapProps>(function Map(
  {
    children,
    className,
    loading = false,
    onClick,
    onViewportChange,
    styles,
    theme: themeProp,
    viewport,
    ...props
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<MapLibreGL.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);
  const currentStyleRef = useRef<MapStyleOption | null>(null);
  const internalUpdateRef = useRef(false);
  const styleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolvedTheme = useResolvedTheme(themeProp);
  const isControlled = viewport !== undefined && onViewportChange !== undefined;
  const onClickRef = useRef(onClick);
  const onViewportChangeRef = useRef(onViewportChange);

  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  const mapStyles = useMemo(
    () => ({
      dark: styles?.dark ?? defaultStyles.dark,
      light: styles?.light ?? defaultStyles.light,
    }),
    [styles],
  );

  useImperativeHandle(ref, () => mapInstance as MapLibreGL.Map, [mapInstance]);

  const clearStyleTimeout = useCallback(() => {
    if (styleTimeoutRef.current) {
      clearTimeout(styleTimeoutRef.current);
      styleTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const initialStyle = resolvedTheme === 'dark' ? mapStyles.dark : mapStyles.light;
    currentStyleRef.current = initialStyle;

    const map = new MapLibreGL.Map({
      attributionControl: { compact: true },
      container: containerRef.current,
      renderWorldCopies: false,
      style: initialStyle,
      ...props,
      ...viewport,
    });

    const styleDataHandler = () => {
      clearStyleTimeout();
      styleTimeoutRef.current = setTimeout(() => setIsStyleLoaded(true), 100);
    };
    const loadHandler = () => setIsLoaded(true);
    const clickHandler = (event: MapLayerMouseEvent) => onClickRef.current?.(event);
    const moveHandler = () => {
      if (!internalUpdateRef.current) {
        onViewportChangeRef.current?.(getViewport(map));
      }
    };

    map.on('load', loadHandler);
    map.on('styledata', styleDataHandler);
    map.on('click', clickHandler);
    map.on('move', moveHandler);
    setMapInstance(map);

    return () => {
      clearStyleTimeout();
      map.off('load', loadHandler);
      map.off('styledata', styleDataHandler);
      map.off('click', clickHandler);
      map.off('move', moveHandler);
      map.remove();
      setIsLoaded(false);
      setIsStyleLoaded(false);
      setMapInstance(null);
    };
    // The map instance should be created once for this mounted container.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapInstance || !isControlled || !viewport || mapInstance.isMoving()) {
      return;
    }

    const current = getViewport(mapInstance);
    const next = {
      bearing: viewport.bearing ?? current.bearing,
      center: viewport.center ?? current.center,
      pitch: viewport.pitch ?? current.pitch,
      zoom: viewport.zoom ?? current.zoom,
    };

    if (
      next.center[0] === current.center[0] &&
      next.center[1] === current.center[1] &&
      next.zoom === current.zoom &&
      next.bearing === current.bearing &&
      next.pitch === current.pitch
    ) {
      return;
    }

    internalUpdateRef.current = true;
    mapInstance.jumpTo(next);
    internalUpdateRef.current = false;
  }, [isControlled, mapInstance, viewport]);

  useEffect(() => {
    if (!mapInstance) {
      return;
    }

    const nextStyle = resolvedTheme === 'dark' ? mapStyles.dark : mapStyles.light;

    if (currentStyleRef.current === nextStyle) {
      return;
    }

    clearStyleTimeout();
    currentStyleRef.current = nextStyle;
    setIsStyleLoaded(false);
    mapInstance.setStyle(nextStyle, { diff: true });
  }, [clearStyleTimeout, mapInstance, mapStyles, resolvedTheme]);

  const contextValue = useMemo(
    () => ({
      isLoaded: isLoaded && isStyleLoaded,
      map: mapInstance,
      resolvedTheme,
    }),
    [isLoaded, isStyleLoaded, mapInstance, resolvedTheme],
  );

  return (
    <MapContext.Provider value={contextValue}>
      <div ref={containerRef} className={cn('relative h-full w-full', className)}>
        {(!isLoaded || loading) && <DefaultLoader />}
        {mapInstance && children}
      </div>
    </MapContext.Provider>
  );
});

type MarkerContextValue = {
  map: MapLibreGL.Map | null;
  marker: MapLibreGL.Marker;
};

const MarkerContext = createContext<MarkerContextValue | null>(null);

function useMarkerContext() {
  const context = useContext(MarkerContext);

  if (!context) {
    throw new Error('Marker components must be used within MapMarker');
  }

  return context;
}

type MapMarkerProps = {
  children: ReactNode;
  latitude: number;
  longitude: number;
  onDrag?: (lngLat: { lat: number; lng: number }) => void;
  onDragEnd?: (lngLat: { lat: number; lng: number }) => void;
  onDragStart?: (lngLat: { lat: number; lng: number }) => void;
} & Omit<MarkerOptions, 'element'>;

export function MapMarker({
  children,
  draggable = false,
  latitude,
  longitude,
  onDrag,
  onDragEnd,
  onDragStart,
}: MapMarkerProps) {
  const { map } = useMap();
  const [marker] = useState(() =>
    new MapLibreGL.Marker({
      draggable,
      element: document.createElement('div'),
    }).setLngLat([longitude, latitude]),
  );

  useEffect(() => {
    if (!map) {
      return;
    }

    marker.addTo(map);

    return () => {
      marker.remove();
    };
  }, [map, marker]);

  useEffect(() => {
    const handleDragStart = () => {
      const lngLat = marker.getLngLat();
      onDragStart?.({ lat: lngLat.lat, lng: lngLat.lng });
    };
    const handleDrag = () => {
      const lngLat = marker.getLngLat();
      onDrag?.({ lat: lngLat.lat, lng: lngLat.lng });
    };
    const handleDragEnd = () => {
      const lngLat = marker.getLngLat();
      onDragEnd?.({ lat: lngLat.lat, lng: lngLat.lng });
    };

    marker.on('dragstart', handleDragStart);
    marker.on('drag', handleDrag);
    marker.on('dragend', handleDragEnd);

    return () => {
      marker.off('dragstart', handleDragStart);
      marker.off('drag', handleDrag);
      marker.off('dragend', handleDragEnd);
    };
  }, [marker, onDrag, onDragEnd, onDragStart]);

  useEffect(() => {
    const current = marker.getLngLat();

    if (current.lng !== longitude || current.lat !== latitude) {
      marker.setLngLat([longitude, latitude]);
    }

    if (marker.isDraggable() !== draggable) {
      marker.setDraggable(draggable);
    }
  }, [draggable, latitude, longitude, marker]);

  return <MarkerContext.Provider value={{ map, marker }}>{children}</MarkerContext.Provider>;
}

export function MarkerContent({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  const { marker } = useMarkerContext();

  return createPortal(
    <div className={cn('relative cursor-pointer', className)}>
      {children ?? (
        <div className="size-4 rounded-full border-2 border-white bg-[var(--blue)] shadow-lg" />
      )}
    </div>,
    marker.getElement(),
  );
}
