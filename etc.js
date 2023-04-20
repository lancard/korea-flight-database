const fs = require('fs');
const util = require('./util.js');

module.exports = {
    initialize() {
        if (!fs.existsSync('etc')) {
            fs.mkdirSync('etc');
        }
    },
    getNuetrainerData() {
        var ret = {
            FixList: {},
            RunwayList: {}
        };

        navaidList.forEach(e => {
            ret.FixList[e.name] = {
                latitude: e.latitudeDecimal,
                longitude: e.longitudeDecimal
            };
        });

        runwayList.filter(e => e.airport == 'RKSI' || e.airport == 'RKSS' || e.airport == 'RKPK' || e.airport == 'RKPC' || e.airport == 'ZKPY').forEach(obj => {
            ret.RunwayList[`${obj.airport}_${obj.runway}`] = {
                ThresholdSideCoordinate: {
                    latitude: obj.startLatitudeDecimal,
                    longitude: obj.startLongitudeDecimal
                },
                LocalizerSideCoordinate: {
                    latitude: obj.endLatitudeDecimal,
                    longitude: obj.endLongitudeDecimal
                },
                Elevation: airportList[obj.airport].elevationInFeet,
                GlideslopeAngle: 3.0,
                MagneticVariation: 7
            };
        });

        return ret;
    },
    generateNuetrainerFile() {
        var nuetrainer_data = this.getNuetrainerData();
        
        fs.writeFileSync('etc/nuetrainer_sector.json', JSON.stringify(nuetrainer_data, null, '\t'));
    }
};