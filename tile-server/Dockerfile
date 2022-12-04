FROM overv/openstreetmap-tile-server:latest

COPY tile-server-postgre-database/db.tar.gz /data/database/db.tar.gz

WORKDIR /data/database

RUN tar xzf db.tar.gz
RUN rm db.tar.gz
