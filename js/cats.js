/* Product categories. One list drives the home page, the Products page tabs and the admin dropdown.
   k = value saved in the database, tab = which Products-page tab it appears under. */
window.TABS=[
 {k:'all',label:'All'},
 {k:'feeds',label:'Feeds'},
 {k:'equipment',label:'Equipment'},
 {k:'supplements',label:'Supplements'},
 {k:'services',label:'Services'}
];
window.CATS=[
 {k:'animal-feeds',label:'Animal Feeds',tab:'feeds',icon:'fa-wheat-awn',blurb:'Hay, kikanja and molasses to keep your herd healthy and your milk flowing.'},
 {k:'silage-making',label:'Silage Making',tab:'services',icon:'fa-seedling',blurb:'Quality silage, silage bags and expert silage making on your farm.'},
 {k:'chopping-machines',label:'Silage Chopping Machines',tab:'equipment',icon:'fa-gears',blurb:'Diesel-powered choppers for fast, even silage. For sale and for hire.'},
 {k:'farm-tools',label:'Farm Tools',tab:'equipment',icon:'fa-screwdriver-wrench',blurb:'Troughs, milking cans and every tool a working farm needs.'},
 {k:'supplements',label:'Supplements',tab:'supplements',icon:'fa-pills',blurb:'Mineral salts, lick blocks and livestock microbes for stronger, healthier animals.'},
 {k:'services',label:'Farm Services',tab:'services',icon:'fa-handshake-angle',blurb:'We come to your farm to train workers and improve your feeding.'}
];
