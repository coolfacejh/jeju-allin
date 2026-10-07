import type {Content} from '../types';
import {THEME_NAME} from './curate';
const normalize=(s:unknown)=>typeof s==='string'?s.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,''):'';
// Partial text matching: even a single character searches all recorded text fields.
export function matchesPlaceKeyword(place:Content,query:string):boolean{
 const words=query.trim().split(/\s+/).map(normalize).filter(Boolean);
 if(!words.length)return true;
 const fields=[place.name,place.desc,place.region,place.providerCategory||'',...(place.hashtags||[]),...(place.tags?.themes||[]).map(t=>THEME_NAME[t])].map(normalize);
 return words.some(word=>fields.some(field=>field.includes(word)));
}
