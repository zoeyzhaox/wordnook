export function wallpaperSvg(id,width=3840,height=2160){
 const w=width,h=height;let art='';
 if(id==='grid'){art=`<defs><pattern id="g" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="#d8dbd8" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" fill="#f1f2ee"/><rect width="100%" height="100%" fill="url(#g)"/><path d="M${w*.18} ${h*.28}v${h*.44}h${w*.64}" fill="none" stroke="#555e59" stroke-width="3"/><circle cx="${w*.62}" cy="${h*.42}" r="12" fill="#365d54"/>`;}
 else if(id==='orbit'){art=`<rect width="100%" height="100%" fill="#172c39"/>${[.23,.32,.41].map(r=>`<ellipse cx="${w*.7}" cy="${h*.53}" rx="${w*r}" ry="${h*r*.75}" transform="rotate(-22 ${w*.7} ${h*.53})" fill="none" stroke="#48606c" stroke-width="2"/>`).join('')}<circle cx="${w*.7}" cy="${h*.53}" r="${h*.13}" fill="#d4b87d"/><circle cx="${w*.38}" cy="${h*.64}" r="${h*.019}" fill="#e1e6e8"/>`;}
 else if(id==='horizon'){art=`<rect width="100%" height="100%" fill="#e8e7e2"/><rect y="${h*.62}" width="100%" height="${h*.38}" fill="#617778"/><circle cx="${w*.73}" cy="${h*.43}" r="${h*.085}" fill="#b67553"/><path d="M0 ${h*.62}H${w}" stroke="#3f5b60" stroke-width="3"/>`;}
 else throw Error('壁纸不存在');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${art}</svg>`;
}
export async function wallpaperPng(id){const svg=wallpaperSvg(id),img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await img.decode();const canvas=document.createElement('canvas');canvas.width=3840;canvas.height=2160;canvas.getContext('2d').drawImage(img,0,0);return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('壁纸导出失败')),'image/png'));}
