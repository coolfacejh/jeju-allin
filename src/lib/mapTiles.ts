import type L from 'leaflet';
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';
import { setWorkerUrl, type StyleSpecification } from 'maplibre-gl';
import workerSource from '../../.test-output/map-worker.txt?raw';
import 'maplibre-gl/dist/maplibre-gl.css';
setWorkerUrl(URL.createObjectURL(new Blob([workerSource],{type:'text/javascript'})));
export type MapStatus='loading'|'ready'|'error';
const STYLE='https://tiles.openfreemap.org/styles/liberty';
const ATTRIBUTION='<a href="https://openfreemap.org/" target="_blank">OpenFreeMap</a> © <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';
// Retain zoom expressions while increasing their output sizes, never their zoom stops.
function readableSize(value:any):any {
 if(typeof value==='number')return Math.max(14,value*1.15);
 if(Array.isArray(value)) {
  const copy=[...value];
  if(copy[0]==='interpolate')for(let i=4;i<copy.length;i+=2)copy[i]=readableSize(copy[i]);
  if(copy[0]==='step')for(let i=2;i<copy.length;i+=2)copy[i]=readableSize(copy[i]);
  return copy;
 }
 return value;
}
export function addBasemap(map:L.Map,onStatus:(s:MapStatus)=>void=()=>{}) {
 let alive=true,layer:ReturnType<typeof maplibreGL>|undefined;
 const controller=new AbortController();
 const timer=setTimeout(()=>{if(alive)onStatus('error');},20000);
 map.getContainer().dataset.basemap='loading';
 onStatus('loading');
 map.setMaxZoom(19);
 map.attributionControl?.addAttribution(ATTRIBUTION);
 fetch(STYLE,{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('style');return r.json();}).then((style:StyleSpecification)=>{
  if(!alive)return;
  for(const item of style.layers){
   if(item.type!=='symbol'||!item.layout)continue;
   if(JSON.stringify(item.layout['text-field']??'').includes('name'))item.layout['text-field']=['coalesce',['get','name:ko'],['get','name'],['get','name:en']];
   if(item.layout['text-size'])item.layout['text-size']=readableSize(item.layout['text-size']);
  }
  layer=maplibreGL({style,attributionControl:false}).addTo(map);
  const gl=layer.getMaplibreMap();
  gl.on('idle',()=>{if(alive){clearTimeout(timer);onStatus('ready');map.getContainer().dataset.basemap='vector-ready';}});
  gl.on('error',()=>{if(alive)onStatus('error');});
 }).catch(()=>{if(alive){clearTimeout(timer);onStatus('error');}});
 return ()=>{alive=false;clearTimeout(timer);controller.abort();if(layer&&map.hasLayer(layer))map.removeLayer(layer);map.attributionControl?.removeAttribution(ATTRIBUTION);};
}
