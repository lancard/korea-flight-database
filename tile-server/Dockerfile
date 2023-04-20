FROM overv/openstreetmap-tile-server:latest AS build

COPY tile-server-postgre-database/db.tar.gz /data/database/db.tar.gz

WORKDIR /data/database

RUN tar xzf db.tar.gz
RUN rm db.tar.gz


FROM overv/openstreetmap-tile-server:latest

COPY --from=build /data/database /data/database
