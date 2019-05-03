'use strict';

const fs = require('fs');
const sbreplace = require('stream-buffer-replace');

module.exports = {
    patch: function(target, patch, callback) {
        let fileTypes = [];
        let filePatches = [];

        let features = Object.keys(patch);

        //get all file types
        features.forEach(featureKey => {
            let patchFeature = patch[featureKey];
            if (!patchFeature.enabled) { return }

            let fileType = patchFeature.patch.file;
            if (fileType !== 'localstorage' && !fileTypes.includes(fileType)) {
                fileTypes.push(fileType);
            }
        });

        //create patch config for each file type
        fileTypes.forEach(fileType => {
            let patchConfig = {
                file: target.files[fileType],
                from: [],
                to: [],
            };

            features.forEach(featureKey => {
                let patchFeature = patch[featureKey];

                if (patchFeature.patch.file === fileType) {
                    if (patchFeature.enabled) {
                        //apply patch
                        patchConfig.from.push(patchFeature.patch.from);
                        patchConfig.to.push(patchFeature.patch.to);
                    }
                    else {
                        //reverse patch
                        patchConfig.from.push(patchFeature.patch.to);
                        patchConfig.to.push(patchFeature.patch.from);
                    }
                }
            });

            filePatches.push(patchConfig);
        });

        console.log('');
        console.log('PLEASE WAIT! PATCHING IN PROGRESS...');

        this.processPatches(filePatches, callback);
    },

    processPatches: function(filePatches, callback, current) {
        let self = this;

        if (typeof current === 'undefined') {
            current = 0;
        }

        let patchConfig = filePatches[current];

        if (typeof patchConfig === 'undefined') {
            callback();
            return;
        }

        if (current === 0) {
            // TODO: Backup original(!)
            // fs.copyFileSync('source.txt', 'destination.txt');
        }

        let readStream = fs.createReadStream(patchConfig.file);
        let writeStream = fs.createWriteStream(patchConfig.file + '_patched');
        for (var i = 0; i < patchConfig.from.length; i++) {
            let from = new Buffer(patchConfig.from[i]);
            let to = new Buffer(patchConfig.to[i]);
            readStream = readStream.pipe(sbreplace(from, to));
        }

        readStream.pipe(writeStream);
        readStream.on('end', () => {
            fs.renameSync(patchConfig.file + '_patched', patchConfig.file);
            console.log('Patching "' + patchConfig.file + '" done!');
            self.processPatches(filePatches, callback, current+1);
        });
    }
};
