const util = require('./util.js');
const airportInformation = require('./database/airport/ZKPY.json');

var currentNumber = 10000;
function getTemplate(lat, lon) {
    currentNumber++;
    return `<TaxiwayPoint displayName="test${currentNumber}" index="${currentNumber}" type="NORMAL" orientation="FORWARD" lat="${lat}" lon="${lon}"/>`
}

var pointList = {};

for (var obj in airportInformation) {
    airportInformation[obj].lineList.forEach(e => {
        e.latitude1 = util.convertMinutesToDecimal(e.latitude1);
        e.longitude1 = util.convertMinutesToDecimal(e.longitude1);
        pointList[e.latitude1 + "_" + e.longitude1] = {
            lat: e.latitude1,
            lon: e.longitude1
        }
    });
}

for (var p in pointList) {
    console.log(getTemplate(pointList[p].lat, pointList[p].lon));
}
