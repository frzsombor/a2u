'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const { exec } = require('child_process');

const analyzer = require('./lib/analyzer')

/* PREPARING */

const platforms = ['win32', 'darwin'];
const platform = process.platform;

if (!platforms.includes(platform)) {
    console.error('This operating system ('+ platform +') is not supported!');
    return;
}

inquirer.registerPrompt(
    'filefolder', require('inquirer-filefolder-prompt')
);

const crossPlatformConfig = {
    'win32': {
        'target': {
            'name': 'DJI Assistant 2.exe',
            'defaultDir': 'C:\\Program Files (x86)\\DJI Product\\DJI Assistant 2\\',
        }
    },
    'darwin': {
        'target': {
            'name': 'Assistant 2.app',
            'defaultDir': '/Applications/',
        }
    }
};

const CONFIG = crossPlatformConfig[platform];

let TARGET = {
    path: null,
    type: null, // 'ALL' | 'Mavic' | 'Phantom'
    version: null,
};

/* STAGE 0 */

console.log('');
console.log('Welcome to %appname%, the latest DJI Assistant 2 unlocker!');
console.log('');

// Scan current dir for 'DJI Assistant 2.exe'
let detected = false;
let currentDir = __dirname;
// currentDir = 'd:\\Program Files (x86)\\DJI Assistant 2';
// currentDir = 'd:\\Program Files (x86)\\DJI Assistant 2 For Mavic';
// currentDir = 'd:\\Program Files (x86)\\DJI Assistant 2 For Phantom\\';
fs.readdirSync(currentDir).forEach(file => {
    if (file === CONFIG.target.name) {
        detected = true;
        console.log('"' + file + '" found in current folder! Analysing...');

        let fileFullPath = currentDir + path.sep + file;
        analyzer.analyzeOn[platform](fileFullPath, function(results, error){
            if (error) {
                console.log('The application in the current folder is not supported!');
                console.log(error);
                console.log('');
                stage1();
                return;
            }
            stage2(results);
        });
    }
});

if (!detected) {
    stage1();
}

/* STAGE 1 */

function stage1() {
    console.log('Please select the DJI Assistant that you want to unlock!');

    inquirer.prompt({
        type: 'filefolder',
        name: 'file',
        message: 'Select "' + CONFIG.target.name + '".',
        messageCTA: 'Press <enter> to select a file.',
        dialog: {
            type: 'OpenFileDialog',
            config: {
                win32: {
                    title: 'Please select ""DJI Assistant 2.exe""',
                }
                //...
            },
        },
        validate: function(file) {
            if (file.length === 0) {
                return 'No file selected.';
            }
            else if (path.basename(file) !== CONFIG.target.name) {
                return 'Unknown file selected: ' + path.basename(file);
            }
            return true;
        }
    }).then(answers => {
        console.log('');
        console.log('Analysing...');
        analyzer.analyzeOn[platform](answers.file, function(results, error){
            if (error) {
                console.log('The selected application is not supported!');
                console.log(error);
                console.log('');
                stage1();
                return;
            }
            stage2(results);
        });
    });
}

function stage2(results) {
    TARGET.path = results.path;
    TARGET.type = results.type;
    TARGET.version = results.version || null;
    // console.log(TARGET);

    console.log(
        'Detected: ' +
        'DJI Assistant 2 (' + TARGET.type + ') ' +
        'version ' + ((TARGET.version) ? 'v'+TARGET.version : '[N/A]') + '.'
    );

    console.log('Target directory: ' + TARGET.path);
    console.log('');

    //TODO: check supported versions
    //TODO: check if already patched (+restore)

    stage3();
}

function stage3() {
}

