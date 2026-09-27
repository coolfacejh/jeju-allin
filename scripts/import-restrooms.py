"""Import the official Jeju-si CSV; run with a downloaded CSV path. Never infer accessibility."""
import csv,json,sys,hashlib
from pathlib import Path
from datetime import date
raw=Path(sys.argv[1]).read_bytes()
try: text=raw.decode('utf-8-sig')
except UnicodeDecodeError: text=raw.decode('cp949')
rows=list(csv.DictReader(text.splitlines()))
def number(v):
 try:
  n=int(v); return n if n>=0 else None
 except (ValueError,TypeError): return None
def yn(v): return True if v=='Y' else False if v=='N' else None
items=[]
for r in rows:
 address=r['도로명 주소'].strip() or r['지번 주소'].strip()
 if not address.startswith('제주특별자치도'): continue
 try: lat,lng=float(r['위도 좌표']),float(r['경도 좌표'])
 except ValueError: lat=lng=None
 if lat is not None and not (33<=lat<=34 and 126<=lng<=127):lat=lng=None
 items.append(dict(id='jejusi-'+r['데이터 코드'],name=r['화장실 명'].strip(),address=address,lat=lat,lng=lng,hours=r['개방 시간 정보'].strip(),phone=r['전화번호'].strip(),operator=r['관리 기관 명'].strip(),maleAccessible=number(r['남성 장애인 대변기 수']),femaleAccessible=number(r['여성 장애인 대변기 수']),diaper=yn(r['기저귀 교환대 설치 여부']),referenceDate=r['데이터 기준일'].strip(),source='제주시 공중화장실',sourceUrl='https://www.data.go.kr/data/15110521/fileData.do'))
assert items and len({p['id'] for p in items})==len(items)
payload=dict(retrievedAt=str(date.today()),coverage='제주시',sourceSha256=hashlib.sha256(raw).hexdigest(),items=items)
Path('src/data/restrooms.json').write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print('Imported',len(items),'coordinate rows',sum(p['lat'] is not None for p in items))
