#!/bin/bash

service postgresql start

# if there is no custom style mounted, then use osm-carto
if [ ! "$(ls -A /data/style/)" ]; then
    mv /home/renderer/src/openstreetmap-carto-backup/* /data/style/
fi

sudo -u renderer osm2pgsql -d gis --append --slim -G --hstore  \
      --tag-transform-script /data/style/openstreetmap-carto.lua  \
      -S /data/style/openstreetmap-carto.style  \
      /data.osm

chmod 777 /data/database -R

service postgresql stop
