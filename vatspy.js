const fs = require('fs');

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
            var label_lon = 0;
            var label_lat = 0;

            e.geometry.coordinates[0][0].forEach(f => {
                label_lon += f[0];
                label_lat += f[1];
            });

            label_lon /= e.geometry.coordinates[0][0].length;
            label_lat /= e.geometry.coordinates[0][0].length;

            e.properties.label_lon = label_lon.toFixed(6);
            e.properties.label_lat = label_lat.toFixed(6);

            ret.push(e.properties.id + ": " + JSON.stringify(e, null, ' ').split("\n").join("").split("  ").join(" ").split("  ").join(" ").split("  ").join(" "));
        });

        fs.writeFileSync('vatspy/geojson.txt', ret.join("\n"));
    }
};