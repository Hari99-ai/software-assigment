const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const catalog=require('../lib/catalog.json');
test('catalog has at least 50 unique complete products across all categories with saved matching source images',()=>{
 assert.ok(catalog.length>=50);assert.equal(new Set(catalog.map(p=>p.id)).size,catalog.length);
 assert.equal(new Set(catalog.map(p=>p.category)).size,5);
 const folder=path.resolve('../../mobile-app/assets/catalog');const files=fs.readdirSync(folder);
 for(const p of catalog){assert.ok(p.name&&p.description&&p.brand&&p.sourceUrl&&Object.keys(p.specifications).length>=2);assert.ok(p.price>0&&p.wholesalePrice<p.price&&p.stock>=0);assert.match(p.image,/^https:\/\/cdn.shopify.com\//);const file=files.find(name=>name.split('.')[0]===p.id);assert.ok(file,`Image missing for ${p.id}`);assert.ok(fs.statSync(path.join(folder,file)).size>1000);}
});
