import data from '../data/easyJejuPlaces.json';
import type {Content} from '../types';
const road=(s:string)=>s.match(/([가-힣a-zA-Z0-9·]+(?:로|길))\s*(\d+(?:-\d+)?)(?!\d)/)?.slice(1).join(':');
const normalize=(s:string)=>s.normalize('NFKC').toLowerCase().replace(/[\s·ㆍ()（）'"-]/g,'');
// Exact full-name and local-area agreement only. Never fuzzy-match facility grades.
export function easyJejuMatch(place:Content){
 if(place.contentType!=='activity')return undefined;
 const name=normalize(place.name||''),region=normalize(place.region||'');
 const matches=data.records.filter(r=>{
  const areas=r.region.split(/\s+/).filter(a=>/시$|읍$|면$|동$/.test(a));
  const street=road(r.address||''),targetStreet=road(place.region||'');
  return normalize(r.name)===name && areas.length>0 && region.includes(normalize(areas[0])) && (street&&targetStreet ? street===targetStreet : areas.every(a=>region.includes(normalize(a))));
 });
 return matches.length===1?{...matches[0],retrievedAt:data.retrievedAt}:undefined;
}
