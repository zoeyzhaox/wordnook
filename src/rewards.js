export const THEMES = [
 {id:'paper',name:'默认蓝色',color:'#006adc',soft:'#eaf3ff',price:0},
 {id:'forest',name:'青绿配色',color:'#157347',soft:'#e9f6ee',price:20},
 {id:'ink',name:'石墨配色',color:'#454b54',soft:'#eff0f2',price:25},
 {id:'plum',name:'梅紫配色',color:'#75456e',soft:'#f6edf4',price:25},
 {id:'rust',name:'砖红配色',color:'#a0432b',soft:'#fff0eb',price:30},
 {id:'ocean',name:'深海配色',color:'#176779',soft:'#e8f5f7',price:30}
];
export const STICKERS = [
 {id:'stamp',name:'已读印章',price:10,description:'单色方章，像书页上的一枚阅读记录。'},
 {id:'ticket',name:'阅读票根',price:15,description:'细线、编号和齿孔，一张小小的入场票。'},
 {id:'pixel',name:'像素书本',price:15,description:'用整齐的像素格画一本打开的书。'}
];
export const WALLPAPERS=[{id:'grid',name:'坐标纸',price:100},{id:'orbit',name:'轨道',price:100},{id:'horizon',name:'地平线',price:100}];
export const rewardPrice = id => THEMES.find(x=>x.id===id)?.price || STICKERS.find(x=>'sticker-'+x.id===id)?.price || WALLPAPERS.find(x=>'wallpaper-'+x.id===id)?.price || 0;
