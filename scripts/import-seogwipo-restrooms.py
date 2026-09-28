"""Import Seogwipo city publication, preserving explicit yes/no and missing coordinates."""
import sys,json,hashlib
from pathlib import Path
from datetime import date
from openpyxl import load_workbook
source='https://www.seogwipo.go.kr/group/clean/environment/archives.htm?act=view&seq=153004675'
p=Path(sys.argv[1]); w=load_workbook(p,data_only=True); items=[]
for r in w.active.values:
 if not isinstance(r[0],(int,float)): continue
 name=str(r[1]).strip(); address=str(r[3]).strip()
 if '제주특별자치도' not in address:
  address=('제주특별자치도 ' if address.startswith('서귀포시') else '제주특별자치도 서귀포시 ')+address
 assert r[7] in ['유','무'],r
 identity=hashlib.sha256((name+'|'+address+'|'+str(r[0])).encode()).hexdigest()[:16]
 items.append(dict(id='seogwipo-'+identity,name=name,address=address,sourceRow=int(r[0]),lat=None,lng=None,hours='상시개방 (원문 분류)' if r[6]=='상시개방화장실' else '정시개방 · 상세 시간 확인 필요' if r[6]=='정시개방화장실' else '',phone=str(r[4] or '').strip(),operator=str(r[2] or '').strip(),maleAccessible=None,femaleAccessible=None,accessibleRegistered=r[7]=='유',accessibleLayout=str(r[8] or ''),diaper=None,referenceDate='2025-12-31',source='서귀포시 공중화장실',sourceUrl=source))
assert len(items)==len({p['id'] for p in items})
payload=dict(retrievedAt=str(date.today()),sourceSha256=hashlib.sha256(p.read_bytes()).hexdigest(),sourceUrl=source,items=items)
Path('src/data/seogwipoRestrooms.json').write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print('Seogwipo records',len(items),'disabled facilities',sum(p['accessibleRegistered'] for p in items))
