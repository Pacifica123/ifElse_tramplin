import { useEffect, useRef, useState } from 'react';
import { load } from '@2gis/mapgl';
import { env } from '@/shared/config/env';
import type { DemoOpportunity } from '../data/demoOpportunities';

type MapInstance = {
  destroy: () => void;
  setCenter: (coordinates: [number, number]) => void;
  setZoom?: (zoom: number) => void;
  invalidateSize?: () => void;
};

type MarkerInstance = {
  destroy?: () => void;
  on?: (event: string, callback: () => void) => void;
};

type MapGlModule = {
  Map: new (
    container: string | HTMLElement,
    options: {
      center: [number, number];
      zoom: number;
      key: string;
      enableTrackResize?: boolean;
    },
  ) => MapInstance;
  Marker: new (
    map: MapInstance,
    options: {
      coordinates: [number, number];
    },
  ) => MarkerInstance;
};

interface DgisMapProps {
  opportunities: DemoOpportunity[];
  activeId: string;
  onPick: (id: string) => void;
}

export function DgisMap({ opportunities, activeId, onPick }: DgisMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const mapglRef = useRef<MapGlModule | null>(null);
  const markersRef = useRef<MarkerInstance[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const activeOpportunity =
    opportunities.find((item) => item.id === activeId) ?? opportunities[0];

  useEffect(() => {
    if (!env.dgisMapKey) {
      setError('Добавьте VITE_2GIS_MAP_KEY в .env, чтобы карта 2ГИС загрузилась.');
      return;
    }

    if (!containerRef.current) return;

    let cancelled = false;

    load()
      .then((mapgl) => {
        if (cancelled || !containerRef.current) return;

        const typedMapgl = mapgl as unknown as MapGlModule;
        mapglRef.current = typedMapgl;

        const map = new typedMapgl.Map(containerRef.current, {
          center: activeOpportunity.coordinates,
          zoom: 4.7,
          key: env.dgisMapKey,
          enableTrackResize: true,
        });

        mapRef.current = map;

        requestAnimationFrame(() => {
          map.invalidateSize?.();
        });

        if (containerRef.current) {
          const observer = new ResizeObserver(() => {
            map.invalidateSize?.();
          });

          observer.observe(containerRef.current);
          resizeObserverRef.current = observer;
        }

        setIsReady(true);
      })
      .catch(() => {
        setError('Не удалось загрузить 2ГИС MapGL. Проверьте ключ и повторите запуск.');
      });

    return () => {
      cancelled = true;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;

      markersRef.current.forEach((marker) => marker.destroy?.());
      markersRef.current = [];

      mapRef.current?.destroy?.();
      mapRef.current = null;
      mapglRef.current = null;
      setIsReady(false);
    };
    // создаём карту один раз
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isReady || !mapRef.current || !mapglRef.current) return;

    markersRef.current.forEach((marker) => marker.destroy?.());
    markersRef.current = [];

    markersRef.current = opportunities.map((item) => {
      const marker = new mapglRef.current!.Marker(mapRef.current as MapInstance, {
        coordinates: item.coordinates,
      });

      marker.on?.('click', () => {
        onPick(item.id);
        mapRef.current?.setCenter(item.coordinates);
        mapRef.current?.setZoom?.(10);
        mapRef.current?.invalidateSize?.();
      });

      return marker;
    });

    requestAnimationFrame(() => {
      mapRef.current?.invalidateSize?.();
    });
  }, [isReady, opportunities, onPick]);

  useEffect(() => {
    if (!mapRef.current || !activeOpportunity) return;

    mapRef.current.setCenter(activeOpportunity.coordinates);
    mapRef.current.setZoom?.(10);

    requestAnimationFrame(() => {
      mapRef.current?.invalidateSize?.();
    });
  }, [activeOpportunity]);

  if (error) {
    return (
      <div className="home-map__fallback">
        <strong>Карта 2ГИС пока не запущена</strong>
        <p>{error}</p>
        <code>VITE_2GIS_MAP_KEY=ваш_ключ_2гис</code>
      </div>
    );
  }

  return <div ref={containerRef} className="home-map__canvas" />;
}