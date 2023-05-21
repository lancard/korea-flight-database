const fs = require('fs');
const turf = require('@turf/turf');

module.exports = {
    initialize() {
        if (!fs.existsSync('vatspy')) {
            fs.mkdirSync('vatspy');
        }
    },
    generateVatspyFile() {
        // get fir
        var geojsonFeatures = JSON.parse(fs.readFileSync('./database/airspace/FIR.geojson')).features;

        var ret = [];

        geojsonFeatures.forEach(e => {
            var polygon = turf.polygon(e.geometry.coordinates[0]);
            var center = turf.centerOfMass(polygon);

            e.properties.label_lon = center.geometry.coordinates[0].toFixed(6);
            e.properties.label_lat = center.geometry.coordinates[1].toFixed(6);

            ret.push(e.properties.id + ": " + JSON.stringify(e, null, ' ').split("\n").join("").split("  ").join(" ").split("  ").join(" ").split("  ").join(" "));
        });

        fs.writeFileSync('vatspy/geojson.txt', ret.join("\n"));
    }
};