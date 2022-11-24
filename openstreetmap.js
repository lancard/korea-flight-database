const dayjs = require('dayjs');
const fs = require('fs');

module.exports = {
    generateOpenstreetmap() {
        var nodeIndex = 140000;
        var wayIndex = 540000;
        var nodes = {};

        navaidList.filter(e => e.navaidType == "VOR").forEach(e => {
            nodeIndex++;

            nodes[e.name] = {
                id: nodeIndex,
                lat: e.latitudeDecimal,
                lon: e.longitudeDecimal,
                tag: [
                    {
                        k: 'aeroway',
                        v: e.vorType.toLowerCase()
                    },
                    {
                        k: 'name',
                        v: e.name
                    },
                ]                
            }
        });

        console.dir(nodes);

        // fs.writeFileSync('vatsim/sector.sct2', contents);
    }
};