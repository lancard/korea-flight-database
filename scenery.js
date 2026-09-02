const util = require('./util.js');
const airportInformation = require('./database/airport/ZKPY.json');

var currentNumber = 10000;
function getTemplate(lat, lon) {
    currentNumber++;
    return `<TaxiwayPoint displayName="test${currentNumber}" index="${currentNumber}" type="NORMAL" orientation="FORWARD" lat="${lat}" lon="${lon}"/>`
}

var pointList = {};

for (var obj in airportInformation) {
    airportInformation[obj].lineList.forEach(path => {
        path.forEach(point => {
            const latitudeDecimal = util.convertMinutesToDecimal(point.latitude);
            const longitudeDecimal = util.convertMinutesToDecimal(point.longitude);
            pointList[latitudeDecimal + "_" + longitudeDecimal] = {
                lat: latitudeDecimal,
                lon: longitudeDecimal
            };
        });
    });
}

for (var p in pointList) {
    console.log(getTemplate(pointList[p].lat, pointList[p].lon));
}
