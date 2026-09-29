import {fetchPlacePhotos} from '../server/placePhotos.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'method_not_allowed'});
 const id=new URL(req.url,'https://local.invalid').searchParams.get('id')||'';
 if(!/^(CNTS|CONT)_[0-9]{15}$/.test(id))return res.status(400).json({error:'invalid_id'});
 try{const data=await fetchPlacePhotos(id);res.setHeader('Cache-Control','public, max-age=3600, s-maxage=86400');return res.status(200).json(data);}
 catch{return res.status(502).json({error:'photos_unavailable'});}
}
