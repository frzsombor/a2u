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
            // 'name': 'DJI Assistant 2 For Phantom.app',
            'name': 'Assistant.app',
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
// currentDir = '/Applications';
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

            analyzer.showResults(results);

            inquirer.prompt({
                type: 'confirm',
                name: 'acceptAutoDetect',
                message: 'Would you like to use the unlocker on this application?',
            }).then(answers => {
                console.log('');

                if (answers.acceptAutoDetect) {
                    stage2(results);
                    return;
                }

                stage1();
                return;
            });
        });
    }
});

if (!detected) {
    stage1();
}

/* STAGE 1 */

function stage1() {
    console.log('Please select the DJI Assistant that you want to unlock!');

    var msg = 'Select "' + CONFIG.target.name + '".';
    if (platform === 'darwin') {
        msg = 'Select the Assistant app.';
    }

    inquirer.prompt({
        type: 'filefolder',
        name: 'file',
        message: msg,
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

            analyzer.showResults(results);
            stage2(results);
        });
    });
}

function stage2(results) {
    TARGET.path = results.path;
    TARGET.type = results.type;
    TARGET.version = results.version || null;
    // console.log(TARGET);

    console.log('Target directory: ' + TARGET.path);
    console.log('');

    //TODO: check supported versions
    //TODO: check if already patched (+restore)

    stage3();
}

function stage3() {
    console.log('Please select what FEATURES you want to ENABLE!');
    console.log('Don\'t worry, you can come back and change them anytime!');
    console.log('');

    console.log('FEATURES INFO:');
    console.log('removeDevToolsBan');
    console.log('enableDebugMode');
    console.log('enableDeveloperMode');
    console.log('showDevToolsOnStartup');
    console.log('');

    let features = {
        'removeDevToolsBan': true,
        'enableDebugMode': false,
        'enableDeveloperMode': false,
        'showDevToolsOnStartup': false,
    };

    let featuresQuestions = [
        {
            type: 'confirm',
            name: 'enableDebugMode',
            message: 'Do you want enableDebugMode?',
        },
        {
            type: 'confirm',
            name: 'enableDeveloperMode',
            message: 'Do you want enableDeveloperMode?',
        },
        {
            type: 'confirm',
            name: 'showDevToolsOnStartup',
            message: 'Do you want showDevToolsOnStartup?',
        },
    ];

    inquirer.prompt(featuresQuestions).then(answers => {
        console.log('');
        Object.assign(features, answers);
        stage4(features);
    });
}

function stage4(features) {
    console.log(features);
}

function stage5() {
    console.log(' = STAGE5 = ');
}
