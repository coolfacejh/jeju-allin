import {cachedEnglishPlace} from '../server/placeEnglish.js';
export default async function handler(req,res) {
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'method_not_allowed'});
 const params=new URL(req.url,'https://local.invalid').searchParams,id=params.get('id')||'';
 if(!/^(CNTS|CONT)_[0-9]{15}$/.test(id)||[...params.keys()].some(k=>k!=='id')||params.getAll('id').length!==1)return res.status(400).json({error:'invalid_id'});
 try{
  const data=await cachedEnglishPlace(id);
  res.setHeader('Cache-Control',data.status==='available'?'public, max-age=300, s-maxage=86400, stale-while-revalidate=3600':'public, max-age=60, s-maxage=3600');
  return res.status(200).json(data);
 }catch{return res.status(502).json({error:'english_source_unavailable'});}
}
