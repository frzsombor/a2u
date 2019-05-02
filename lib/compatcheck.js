'use strict';

const semver = require('semver');
const patches = require('../patches');

module.exports = function(type, version, callback) {
    let result = 0;
    let patch = null;

    let platform = process.platform;
    let versions = Object.keys(patches[platform][type]);
    let oldestSupported = versions[0];
    let latestSupported = versions[versions.length-1];
    version = semver.coerce(version).version;

    if (versions.includes(version)) {
        console.log('This version is supported!');
        console.log('');

        patch = patches[platform][type][version];
        callback(result, patch);
        return;
    }

    console.log('');
    console.log('WARNING!');

    if (semver.gt(version, latestSupported)) {
        console.log('This version is newer than the latest supported version!');
        result = 1;
        patch = patches[platform][type][latestSupported];
    }
    else if (semver.lt(version, oldestSupported)) {
        console.log('This version is older that the first supported version!');
        result = -1;
        patch = patches[platform][type][oldestSupported];
    }
    else {
        console.log('This version is not in the list of the supported versions!');
        result = 2;
        patch = patches[platform][type][latestSupported];
    }

    console.log('However, the unlocker might work, and you can give it a try.');
    console.log('If the Assistant app won\'t run, you can come back to reverse the patch, or reinstall the application.');
    console.log('');

    callback(result, patch);
};
