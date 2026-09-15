import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import type { Content } from '../types';
import { loadMapViewport, saveMapViewport } from '../lib/explore';

function textLabel(value: string): HTMLElement {
  const element = document.createElement('span');
  element.textContent = value;
  return element;
}

const COLOR: Record<string, string> = {
  stay: '#0A6E6D',
  food: '#F97316',
  activity: '#2563eb',
};

// 항상 이름표를 보여줄 제주 대표 명소(명소당 1개, 즐길거리에서)
const MAJOR = [
  '한라산', '성산일출봉', '우도', '섭지코지', '만장굴', '비자림', '천지연', '중문', '산방산',
  '협재', '월정리', '함덕', '주상절리', '오설록', '카멜리아', '새별오름', '금오름', '쇠소깍',
];
const majorToken = (name = '') => MAJOR.find((m) => name.includes(m)) || null;

const JEJU_BOUNDS = L.latLngBounds([33.10, 126.10], [33.62, 127.00]);
const LABEL_ZOOM = 13; // 이 줌 이상에서 개별 스팟 이름표 표시

function dotIcon(color: string, big = false) {
  const s = big ? 15 : 11;
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:${s}px;height:${s}px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.35)"></span>`,
    iconSize: [s, s],
    iconAnchor: [s / 2, s / 2],
  });
}

type Spot = { lat: number; lng: number; name: string };
export type MySpot = { id: number; name: string; lat: number; lng: number };

function myIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50% 50% 50% 0;background:#db2777;border:2px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,.4);transform:rotate(-45deg)"><span style="transform:rotate(45deg);color:#fff;font-size:14px;line-height:1">★</span></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 24],
    popupAnchor: [0, -22],
  });
}

export default function PlaceMap({
  places,
  onOpen,
  addMode = false,
  onPick,
  mySpots = [],
  onDeleteMySpot,
}: {
  places: Content[];
  onOpen: (id: number) => void;
  addMode?: boolean;
  onPick?: (lat: number, lng: number) => void;
  mySpots?: MySpot[];
  onDeleteMySpot?: (id: number) => void;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const majorRef = useRef<L.LayerGroup | null>(null);
  const labelRef = useRef<L.LayerGroup | null>(null);
  const myRef = useRef<L.LayerGroup | null>(null);
  const spotsRef = useRef<Spot[]>([]);
  const refreshRef = useRef<() => void>(() => {});
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const onDelRef = useRef(onDeleteMySpot);
  onDelRef.current = onDeleteMySpot;

  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, {
      center: [33.38, 126.53],
      zoom: 10,
      minZoom: 9,
      maxBounds: JEJU_BOUNDS,
      maxBoundsViscosity: 0.8,
    });
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, attribution: '&copy; Esri' },
    ).addTo(map);

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 48,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      chunkedLoading: true,
      iconCreateFunction: (c) => {
        const n = c.getChildCount();
        const size = n >= 100 ? 46 : n >= 30 ? 40 : 34;
        return L.divIcon({
          className: '',
          html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:rgba(10,110,109,.92);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)">${n}</div>`,
          iconSize: [size, size],
        });
      },
    });
    cluster.addTo(map);
    const major = L.layerGroup().addTo(map);
    const labels = L.layerGroup().addTo(map);
    const mine = L.layerGroup().addTo(map);
    clusterRef.current = cluster;
    majorRef.current = major;
    labelRef.current = labels;
    myRef.current = mine;
    mapRef.current = map;

    // 내 스팟 추가 모드: 지도 클릭 시 위치 전달
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onPickRef.current) onPickRef.current(e.latlng.lat, e.latlng.lng);
    });

    // 줌인해서 개별 스팟이 보일 때만 이름표 레이어를 채운다
    const refresh = () => {
      const lyr = labelRef.current;
      if (!lyr) return;
      lyr.clearLayers();
      if (map.getZoom() < LABEL_ZOOM) return;
      const b = map.getBounds();
      const inview = spotsRef.current.filter((s) => b.contains([s.lat, s.lng]));
      if (inview.length === 0 || inview.length > 60) return;
      for (const s of inview) {
        L.marker([s.lat, s.lng], {
          icon: L.divIcon({ className: '', html: '', iconSize: [0, 0] }),
          interactive: false,
          keyboard: false,
        })
          .bindTooltip(textLabel(s.name), { permanent: true, direction: 'right', offset: [9, 0], className: 'jmap-spot' })
          .addTo(lyr);
      }
    };
    refreshRef.current = refresh;
    map.on('zoomend moveend', refresh);

    const viewport = loadMapViewport();
    if (viewport) map.setView([viewport.lat, viewport.lng], viewport.zoom, { animate: false });
    else map.fitBounds(JEJU_BOUNDS, { padding: [10, 10] });
    const rememberView = () => {
      const center = map.getCenter();
      saveMapViewport({ lat: center.lat, lng: center.lng, zoom: map.getZoom() });
    };
    map.on('moveend zoomend', rememberView);
    const resizeTimer = setTimeout(() => map.invalidateSize({ pan: false }), 120);
    return () => {
      clearTimeout(resizeTimer);
      rememberView();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    const major = majorRef.current;
    if (!map || !cluster || !major) return;
    cluster.clearLayers();
    major.clearLayers();

    const popupHtml = (p: Content) => {
      const name = (p.name || '').replace(/[<>&]/g, '');
      const region = (p.region || '').replace(/[<>&]/g, '');
      return (
        `<div style="font-weight:700;font-size:13px;margin-bottom:2px">${name}</div>` +
        `<div style="font-size:11px;color:#64748b;margin-bottom:6px">${region}</div>` +
        `<button data-id="${p.id}" class="jmap-open" style="background:#0A6E6D;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer">상세 보기</button>`
      );
    };

    const clusterMarkers: L.Marker[] = [];
    const spots: Spot[] = [];
    const usedMajor = new Set<string>();
    for (const p of places) {
      if (p.lat == null || p.lng == null) continue;
      const color = COLOR[p.contentType] ?? '#64748b';
      const token = p.contentType === 'activity' ? majorToken(p.name) : null;
      if (token && !usedMajor.has(token)) {
        usedMajor.add(token);
        const m = L.marker([p.lat, p.lng], { icon: dotIcon(color, true), zIndexOffset: 1000 });
        m.bindPopup(popupHtml(p));
        m.bindTooltip(token, { permanent: true, direction: 'right', offset: [8, 0], className: 'jmap-label' });
        m.addTo(major);
      } else {
        const m = L.marker([p.lat, p.lng], { icon: dotIcon(color) });
        m.bindPopup(popupHtml(p));
        clusterMarkers.push(m);
        spots.push({ lat: p.lat, lng: p.lng, name: p.name || '' });
      }
    }
    cluster.addLayers(clusterMarkers);
    spotsRef.current = spots;
    setTimeout(() => refreshRef.current(), 150);

    map.on('popupopen', (e: L.PopupEvent) => {
      const node = (e.popup as unknown as { _contentNode?: HTMLElement })._contentNode;
      const openBtn = node?.querySelector('.jmap-open') as HTMLElement | null;
      if (openBtn) openBtn.onclick = () => onOpenRef.current(Number(openBtn.getAttribute('data-id')));
      const delBtn = node?.querySelector('.jmap-del') as HTMLElement | null;
      if (delBtn) delBtn.onclick = () => onDelRef.current?.(Number(delBtn.getAttribute('data-id')));
    });
  }, [places]);

  // 내 스팟 마커 렌더
  useEffect(() => {
    const mine = myRef.current;
    if (!mine) return;
    mine.clearLayers();
    for (const s of mySpots) {
      const name = (s.name || '내 스팟').replace(/[<>&]/g, '');
      const m = L.marker([s.lat, s.lng], { icon: myIcon(), zIndexOffset: 2000 });
      m.bindTooltip(textLabel(name), { permanent: true, direction: 'right', offset: [10, -8], className: 'jmap-my' });
      m.bindPopup(
        `<div style="font-weight:700;font-size:13px;margin-bottom:6px">★ ${name}</div>` +
          `<button data-id="${s.id}" class="jmap-del" style="background:#db2777;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer">삭제</button>`,
      );
      m.addTo(mine);
    }
  }, [mySpots]);

  // 추가 모드 커서
  useEffect(() => {
    const el = elRef.current;
    if (el) el.style.cursor = addMode ? 'crosshair' : '';
  }, [addMode]);

  return (
    <div className="flex flex-col gap-2">
      <style>{`.jmap-label{background:rgba(255,255,255,.95);border:none;box-shadow:0 1px 3px rgba(0,0,0,.25);border-radius:6px;padding:1px 6px;font-size:12px;font-weight:800;color:#0A6E6D}.jmap-label::before{display:none}.jmap-spot{background:rgba(255,255,255,.92);border:none;box-shadow:0 1px 2px rgba(0,0,0,.2);border-radius:5px;padding:0 5px;font-size:10px;font-weight:700;color:#0f172a;white-space:nowrap}.jmap-spot::before{display:none}.jmap-my{background:#db2777;border:none;box-shadow:0 1px 3px rgba(0,0,0,.3);border-radius:6px;padding:1px 6px;font-size:11px;font-weight:800;color:#fff;white-space:nowrap}.jmap-my::before{display:none}`}</style>
      <div ref={elRef} className="w-full rounded-2xl overflow-hidden shadow-card z-0" style={{ height: '68vh' }} />
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3 text-[11px] text-muted">
          <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: COLOR.stay }} /> 숙소</span>
          <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: COLOR.food }} /> 먹거리</span>
          <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: COLOR.activity }} /> 즐길거리</span>
        </div>
        <span className="text-[10px] text-muted">확대하면 장소 이름이 표시됩니다</span>
      </div>
    </div>
  );
}
