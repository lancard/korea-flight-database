#!/bin/bash

service postgresql start

# if there is no custom style mounted, then use osm-carto
if [ ! "$(ls -A /data/style/)" ]; then
    mv /home/renderer/src/openstreetmap-carto-backup/* /data/style/
fi

sudo -u renderer psql -d gis -f /data.sql

service postgresql stop

cd /data/database && tar czf ../db.tar.gz *
chmod 777 /data/db.tar.gz
rm -rf /data/database/*
mv /data/db.tar.gz /data/database/
