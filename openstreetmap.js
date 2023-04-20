const fs = require('fs');

module.exports = {
    initialize() {
        if (!fs.existsSync('openstreetmap')) {
            fs.mkdirSync('openstreetmap');
        }
    },
    getNavaidSql() {
        var ret =
            `
        CREATE TABLE public.navaid (
            osm_id int8 PRIMARY KEY,
            name text NULL,
            navaid_type text NULL,
            extra_type text NULL,
            vor_type text NULL,
            description text NULL,
            airport text NULL,
            frequency text NULL,
            way public.geometry(point, 3857) NULL
        );
        `

        var nodeIndex = 140000;

        navaidList.forEach(e => {
            nodeIndex++;
            ret += ` INSERT INTO public.navaid VALUES(${nodeIndex}, '${e.name}', '${e.navaidType}', '${e.extraType ? e.extraType : ''}', '${e.vorType ? e.vorType : ''}', '${e.description}', '${e.airport ? e.airport : ''}', '${e.frequency}', ST_Transform(ST_GeomFromText('POINT (${e.longitudeDecimal} ${e.latitudeDecimal})', 4326), 3857)); `;
        });

        return ret;
    },
    getAirwaySql() {
        var ret =
            `
        CREATE TABLE public.airway (
            osm_id int8 PRIMARY KEY,
            name text NULL,
            seq int8 NULL,
            description text NULL,
            airway_type text NULL,
            fixStart text NULL,
            fixEnd text NULL,
            way public.geometry(linestring, 3857) NULL
        );
        `
        var fixToIdMap = {};

        navaidList.forEach(e => {
            fixToIdMap[e.name] = e;
        });

        var wayIndex = 540000;

        airwayList.forEach(e => {
            wayIndex++;

            if (!fixToIdMap[e.fixStart] || !fixToIdMap[e.fixEnd]) {
                console.log(`airway fix not exist: ${e.fixStart} / ${e.fixEnd}`);
            }

            ret += ` INSERT INTO public.airway VALUES(${wayIndex}, '${e.name}', ${e.seq}, '${e.description}', '${e.airwayType}', '${e.fixStart}', '${e.fixEnd}', ST_Transform(ST_GeomFromText('LINESTRING (${fixToIdMap[e.fixStart].longitudeDecimal} ${fixToIdMap[e.fixStart].latitudeDecimal}, ${fixToIdMap[e.fixEnd].longitudeDecimal} ${fixToIdMap[e.fixEnd].latitudeDecimal})', 4326), 3857)); `;
        });

        return ret;
    },
    getAirportSql() {
        var ret =
            `
        CREATE TABLE public.airport (
            osm_id int8 PRIMARY KEY,
            icao_code text NULL,
            iata_code text NULL,
            description text NULL,
            continent text NULL,
            country text NULL,
            municipality text NULL,
            airport_type text NULL,
            elevation int8 NULL,
            way public.geometry(point, 3857) NULL
        );
        `

        var airportIndex = 740000;

        for (icao in airportList) {
            airportIndex++;
            var e = airportList[icao];

            ret += ` INSERT INTO public.airport VALUES(${airportIndex}, '${e.icaoCode}', '${e.iataCode}', '${e.description.split("'").join("｀")}', '${e.continent.split("'").join("｀")}', '${e.country.split("'").join("｀")}', '${e.municipality.split("'").join("｀")}', '${e.type}', ${e.elevationInFeet}, ST_Transform(ST_GeomFromText('POINT (${e.longitudeDecimal} ${e.latitudeDecimal})', 4326), 3857)); `;
        };

        return ret;
    },
    generateOpenstreetmap() {
        var fileContents = "";

        fileContents += this.getNavaidSql();
        fileContents += this.getAirwaySql();
        fileContents += this.getAirportSql();

        fs.writeFileSync('openstreetmap/data.sql', fileContents);
    }
};