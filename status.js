global.airwayList = require('./database/airway.json');
global.navaidList = require('./database/navaid.json');
global.procedureList = require('./database/procedure.json');


var navaidMap = {};
navaidList.forEach(e => {
    if (!navaidMap[e.name])
        navaidMap[e.name] = {};

    airwayList.forEach(p => {
        if (p.fixStart == e.name || e.fixEnd == e.name) {
            navaidMap[e.name]["AIRWAY"] = true;
        }
    });

    procedureList.filter(p => p.procedureType == "SID").forEach(p => {
        p.fixList.forEach(f => {
            if (f.length > 10)
                return;

            if (f == e.name) {
                navaidMap[e.name]["SID"] = true;
            }
        });
    });
    procedureList.filter(p => p.procedureType == "STAR").forEach(p => {
        p.fixList.forEach(f => {
            if (f.length > 10)
                return;

            if (f == e.name) {
                navaidMap[e.name]["STAR"] = true;
            }
        });
    });
    procedureList.filter(p => p.procedureType == "APPROACH").forEach(p => {
        p.fixList.forEach(f => {
            if (f.length > 10)
                return;

            if (f == e.name) {
                navaidMap[e.name]["APPROACH"] = true;
            }
        });
    });
});


for (navaid in navaidMap) {
    console.log(`${navaid}: ${Object.keys(navaidMap[navaid])}`);
}
