[out:json][timeout:120];
(
  way["building"](51.5310,-0.1560,51.5470,-0.1300);
  relation["building"](51.5310,-0.1560,51.5470,-0.1300);
  way["highway"](51.5310,-0.1560,51.5470,-0.1300);
  way["waterway"="canal"](51.5310,-0.1560,51.5470,-0.1300);
  way["natural"="water"](51.5310,-0.1560,51.5470,-0.1300);
  relation["natural"="water"](51.5310,-0.1560,51.5470,-0.1300);
  way["leisure"~"park|garden|playground|pitch"](51.5310,-0.1560,51.5470,-0.1300);
  way["landuse"~"grass|recreation_ground|village_green|cemetery|allotments"](51.5310,-0.1560,51.5470,-0.1300);
  way["railway"~"rail|subway|light_rail"](51.5310,-0.1560,51.5470,-0.1300);
  node["natural"="tree"](51.5310,-0.1560,51.5470,-0.1300);
  node["highway"="street_lamp"](51.5310,-0.1560,51.5470,-0.1300);
);
out geom;
