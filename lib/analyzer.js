'use strict';

const fs = require('fs');
const path = require('path');

module.exports = {
    analyzeOn: {
        win32: function(file, callback) {
            let results = {};
            let basePath = path.dirname(file) + path.sep;

            results.path = basePath;

            try {
                let mainFile = fs.readFileSync(file);
                let uavService;

                if (mainFile.includes('DJI Assistant 2\\ALL')) {
                    results.type = 'ALL';
                    results.asar = basePath + 'AppFiles\\app.asar';
                    uavService = fs.readFileSync(basePath + 'Assistant\\Services\\DJIUavService.dll');
                }
                else {
                    results.asar = basePath + 'DJIApp\\app.asar';

                    let deviceFile = fs.readFileSync(basePath + 'DJIEngine\\DJIDevice.dll');
                    uavService = fs.readFileSync(basePath + 'DJIEngine\\DJIServices\\DJIUavService.dll');

                    if (deviceFile.includes('DJI Assistant 2\\Mavic')) {
                        results.type = 'Mavic';
                    }
                    else if (deviceFile.includes('DJI Assistant 2\\Phantom')) {
                        results.type = 'Phantom';
                    }
                    else {
                        throw new Error('Unknown type!');
                    }
                }

                try {
                    let appVerPos = uavService.indexOf('APP_VER');

                    if (appVerPos !== -1) {
                        let appVerPosStart = appVerPos + 8;
                        let appVerPosEnd = uavService.indexOf(new Buffer([0x00]), appVerPosStart);
                        let version = uavService.toString('utf8', appVerPosStart, appVerPosEnd);
                        results.version = version;
                    }
                    else {
                        throw new Error('Unable to detect version!')
                    }
                }
                catch (e) {
                    console.log(e.message);
                    throw new Error('Unknown version!')
                }
            }
            catch(e) {
                callback(null, 'Analyzer error: ' + e.message);
                return;
            }

            callback(results, null);
        },
        darwin: function(app, callback) {
            //TODO: set asar locations
            let results = {};
            let basePath = app + (app.endsWith(path.sep)?'':path.sep);

            results.path = basePath;

            try {
                let realMainFile = basePath + 'Contents/MacOS/Assistant';
                let mainFile = fs.readFileSync(realMainFile);
                let uavService;

                if (mainFile.includes('DJI Assistant 2\\ALL')) {
                    results.type = 'ALL';
                    uavService = fs.readFileSync(basePath + 'Contents/MacOS/Services/libDJIUavService.dylib');
                }
                else {
                    uavService = fs.readFileSync(basePath + 'Contents/MacOS/DJIServices/libDJIUavService.dylib');

                    if (mainFile.includes('DJI Assistant 2\\Mavic')) {
                        results.type = 'Mavic';
                    }
                    else if (mainFile.includes('DJI Assistant 2\\Phantom')) {
                        results.type = 'Phantom';
                    }
                    else {
                        throw new Error('Unknown type!');
                    }
                }

                try {
                    let appVerPos = uavService.indexOf('APP_VER');

                    if (appVerPos !== -1) {
                        let appVerPosEnd = appVerPos - 1;
                        let appVerPosStart = uavService.lastIndexOf(new Buffer([0x00]), appVerPosEnd - 1);
                        let version = uavService.toString('utf8', appVerPosStart, appVerPosEnd);
                        results.version = version;
                    }
                    else {
                        throw new Error('Unable to detect version!')
                    }
                }
                catch (e) {
                    console.log(e.message);
                    throw new Error('Unknown version!')
                }
            }
            catch(e) {
                callback(null, 'Analyzer error: ' + e.message);
                return;
            }

            callback(results, null);
        },
    },

    showResults: function(results) {
        console.log(
            'Detected: ' +
            'DJI Assistant 2 (' + results.type + ') ' +
            'version ' + ((results.version) ? 'v'+results.version : '[N/A]') + '.'
        );
    }
};
