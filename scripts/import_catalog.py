"""Import public manufacturer product metadata and exact matching images.

Run from the project root: python scripts/import_catalog.py [--refresh]
Retail/wholesale prices and inventory are assignment fixtures, not supplier offers.
"""
import csv
import html
import json
import re
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path
from urllib.parse import urlparse
import requests

ROOT = Path(__file__).resolve().parents[1]
SOURCES={'kent':'https://www.kent.co.in','bluestar':'https://consumer.bluestarindia.com','crompton':'https://www.crompton.co.in','aquasure':'https://aquasureusa.com'}
CACHE=ROOT/'.catalog-cache'
CACHE.mkdir(exist_ok=True)

def load(name):
    path=CACHE/(name+'.json')
    if '--refresh' in sys.argv or not path.exists():
        response=requests.get(SOURCES[name]+'/products.json?limit=250',timeout=45)
        response.raise_for_status()
        path.write_text(json.dumps(response.json()['products']),encoding='utf8')
    return json.loads(path.read_text(encoding='utf8'))

data={name:load(name) for name in SOURCES}
selection=[]
def choose(source,category,prefix,count,predicate):
    candidates=[p for p in data[source] if predicate(p) and p.get('images') and p.get('variants') and float(p['variants'][0]['price'])>0]
    if len(candidates)<count:raise ValueError(f'{category}: need {count}, found {len(candidates)}')
    for i,p in enumerate(candidates[:count]):selection.append((source,category,f'{prefix}{i+1:03}',p))

choose('kent','water-purifiers','WP',16,lambda p:p['product_type'] in ['RO Purifiers','UV Purifiers','Gravity Purifiers','Commercial Purifiers'] and 'filter' not in p['title'].lower())
choose('bluestar','water-dispensers','WD',5,lambda p:p['product_type']=='Dispenser')
choose('crompton','water-pumps','WM',8,lambda p:'pump' in p['title'].lower() and 'controller' not in p['title'].lower() and p['product_type'] in ['Mini','Agricultural Pumps'])
choose('aquasure','filters-cartridges','FC',12,lambda p:p['product_type']=='Water Filters' and any(w in p['title'].lower() for w in ['filter','cartridge','membrane']))
choose('aquasure','spare-parts','SP',10,lambda p:p['product_type']=='Parts' and any(w in p['title'].lower() for w in ['valve','elbow','connector','o-ring','transformer','basket','fitting','bracket','clip','adapter','tube']))

catalog=[];images=[]
for source,category,product_id,p in selection:
    variant=p['variants'][0]
    # Use the first variant's own image where available, otherwise product cover.
    variant_image=next((i for i in p['images'] if variant['id'] in i.get('variant_ids',[])),p['images'][0])
    image=variant_image['src']
    currency='USD' if source=='aquasure' else 'INR'
    fixture_price=round(float(variant['price'])*(85 if currency=='USD' else 1))
    specifications={'Model / SKU':variant.get('sku') or p['handle'],'Product family':p['product_type']}
    for option in p.get('options',[]):
        if option['name'].lower() not in ['title'] and option.get('values'):specifications[option['name']]=str(option['values'][0])
    # Extract short factual specification table cells rather than marketing copy.
    for row in re.findall(r'<tr[^>]*>(.*?)</tr>',p.get('body_html',''),re.S|re.I):
        cells=[html.unescape(re.sub('<[^>]+>','',s)).strip() for s in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>',row,re.S|re.I)]
        if len(cells)==2 and 1<len(cells[0])<60 and 0<len(cells[1])<140 and len(specifications)<10:specifications[cells[0]]=cells[1]
    name=html.unescape(p['title']).strip()
    record={'id':product_id,'name':name,'category':category,'brand':{'kent':'KENT','bluestar':'Blue Star','crompton':'Crompton','aquasure':'Aquasure'}[source],
      'description':f'{name}. {p["product_type"]} from the manufacturer catalog. Check the listed model and installation compatibility before ordering.',
      'price':fixture_price,'wholesalePrice':round(fixture_price*.75),'image':image,'stock':20+(len(catalog)*7)%80,'available':True,
      'specifications':specifications,'rating':0,'reviewCount':0,'tags':[category,p['product_type'].lower()],'featured':category=='water-purifiers' and len(catalog)<6,
      'sourceUrl':SOURCES[source]+'/products/'+p['handle'],'sourceCurrency':currency,'sourcePrice':variant['price'],'catalogCheckedAt':date.today().isoformat(),'sampleInventory':True}
    catalog.append(record)
    extension=Path(urlparse(image).path).suffix.lower()
    if extension not in ['.jpg','.jpeg','.png','.webp']:extension='.jpg'
    images.append((product_id,image,extension))

folder=ROOT/'mobile-app/assets/catalog';folder.mkdir(exist_ok=True)
def download(item):
    product_id,url,extension=item
    path=folder/(product_id+extension)
    if not path.exists():
        response=requests.get(url,timeout=45);response.raise_for_status()
        if not response.headers.get('Content-Type','').startswith('image/'):raise ValueError('Not an image: '+product_id)
        path.write_bytes(response.content)
    return product_id,extension,path.stat().st_size
with ThreadPoolExecutor(max_workers=5) as pool:downloaded=list(pool.map(download,images))
target=ROOT/'backend/functions/src/catalog.json';target.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
mapping=ROOT/'mobile-app/src/data/catalogImages.ts';mapping.parent.mkdir(exist_ok=True)
mapping.write_text("import type {ImageSourcePropType} from 'react-native';\nexport const catalogImages: Record<string,ImageSourcePropType> = {\n"+''.join(f"  '{product_id}': require('../../assets/catalog/{product_id}{extension}'),\n" for product_id,extension,_ in downloaded)+"};\nexport const productImage = (product: {id:string;image:string}): ImageSourcePropType => catalogImages[product.id] || {uri:product.image};\n",encoding='utf8')
with (ROOT/'instagram-automation/products.csv').open('w',newline='',encoding='utf8') as stream:
    writer=csv.writer(stream);writer.writerow(['product_id','product_name','category','description','features','price','product_image_url','publication_status','scheduled_date','generated_caption','published_post_url','error_message','publication_timestamp'])
    for p in catalog:writer.writerow([p['id'],p['name'],p['category'],p['description'],'; '.join(k+': '+v for k,v in p['specifications'].items()),p['price'],p['image'],'pending','2099-01-01','','','',''])
report=['# Catalog sources','',f'{len(catalog)} unique product records imported from public manufacturer catalogs. Matching images are saved without transformation in `mobile-app/assets/catalog/`.','', 'Names, model identifiers, variants, source prices and image associations come from manufacturer product feeds. Stock is synthetic assignment inventory. Selling/wholesale prices are fixtures; US supplier prices use a fixed sample factor of 85 to produce INR demo prices, not a live exchange rate or Indian retail offer. Ratings/review counts are zero rather than invented endorsements.','', 'Manufacturer imagery remains the property of its owners. This assignment does not establish redistribution/commercial-use rights; obtain the relevant rights before commercial deployment.','', '| ID | Product | Source |','| --- | --- | --- |']
report += [f'| {p["id"]} | {p["name"].replace("|","/")} | [Manufacturer]({p["sourceUrl"]}) |' for p in catalog]
(ROOT/'documentation/catalog-sources.md').write_text('\n'.join(report)+'\n',encoding='utf8')
print(json.dumps({'products':len(catalog),'categories':{c:sum(p['category']==c for p in catalog) for c in sorted(set(p['category'] for p in catalog))},'image_bytes':sum(size for _,_,size in downloaded)}))
