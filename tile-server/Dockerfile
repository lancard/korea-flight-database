FROM overv/openstreetmap-tile-server:latest

COPY tile-server-postgre-database/db.tar.gz /data/db.tar.gz

WORKDIR /data

RUN tar xzf db.tar.gz
