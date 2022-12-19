const fs = require('fs');

const util = require('./util.js');

module.exports = {
    initialize() {
        if (!fs.existsSync('vatsim')) {
            fs.mkdirSync('vatsim');
        }
    },
    getPosition() {
        const positionList = require('./database/position.json');

        var ret;

        for(var callsign in positionList) {
            var e = positionList[callsign];
    
            ret += [
                callsign,
                e.name,
                e.frequency,
                e.initialID,
                e.middleFix,
                e.prefix,
                e.position,
                '-',
                '-',
                '0000',
                '7777'
            ].join(":");
        }

        return ret.join("\n");
    },
    generateEseFile() {
        var contents = "";

        contents += "\n\n[POSITIONS]\n";
        contents += this.getPosition();

        fs.writeFileSync('vatsim/sector.ese', contents.split("\n").join("\r\n"));
    }
};