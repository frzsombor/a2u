'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const { exec } = require('child_process');

const analyzer = require('./lib/analyzer');
const supportcheck = require('./lib/supportcheck');

/* PREPARING */

const platforms = ['win32', 'darwin'];
const platform = process.platform;

if (!platforms.includes(platform)) {
    console.error('This operating system ('+ platform +') is not supported!');
    return;
}

global.versionSupport = {
    win32: {
        ALL: [ '1.2.5' ],
        Mavic: [ '2.0.8' ],
        Phantom: [ '2.0.7' ],
    },
    darwin: {
    },
};

const crossPlatformConfig = {
    win32: {
        target: {
            name: 'DJI Assistant 2.exe',
            defaultDir: 'C:\\Program Files (x86)\\DJI Product\\DJI Assistant 2\\',
        }
    },
    darwin: {
        target: {
            // name: 'DJI Assistant 2 For Phantom.app',
            name: 'Assistant.app',
            defaultDir: '/Applications/',
        }
    }
};

const CONFIG = crossPlatformConfig[platform];

let TARGET = {
    path: null,
    type: null, // 'ALL' | 'Mavic' | 'Phantom'
    version: null,
    asar: null,
};

inquirer.registerPrompt(
    'filefolder', require('inquirer-filefolder-prompt')
);

/* STAGE 0 */

console.log('');
console.log('Welcome to %appname%, the latest DJI Assistant 2 unlocker!');
console.log('');

// Scan current dir for 'DJI Assistant 2.exe'
let detected = false;
let currentDir = __dirname;
// currentDir = '/Applications';
currentDir = 'd:\\Program Files (x86)\\DJI Assistant 2';
currentDir = 'd:\\Program Files (x86)\\DJI Assistant 2 For Mavic';
currentDir = 'd:\\Program Files (x86)\\DJI Assistant 2 For Phantom\\';
fs.readdirSync(currentDir).forEach(file => {
    //TODO: multiple
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
            supportcheck(results.type, results.version);

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

            var support = supportcheck(results.type, results.version);
            if (support !== 0) {
                inquirer.prompt({
                    type: 'confirm',
                    name: 'forceRun',
                    message: 'Would you like to use the unlocker on this version?',
                }).then(answers => {
                    console.log('');

                    if (answers.forceRun) {
                        stage2(results);
                        return;
                    }

                    stage1();
                });
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
    TARGET.asar = results.asar;

    console.log('Target directory: ' + TARGET.path);
    console.log('');

    //TODO: check if already patched (+restore)

    stage3();
}

function stage3() {
    let features = {
        removeDevToolsBan: true,
        enableDebugMode: true,
        enableDeveloperMode: false,
        showDevToolsOnStartup: false,
    };

    inquirer.prompt({
        type: 'list',
        name: 'mode',
        message: 'Please select a mode for this unlocker:',
        choices: ['Automatic mode', 'Advanced mode'],
        filter: function(val) {
            return (val.split(' '))[0].toLowerCase();
        }
    })
    .then(answers => {
        if (answers.mode === 'automatic') {
            stage4(features);
            return;
        }

        console.log('');
        console.log('FEATURES LIST:');
        console.log('- Remove "anti-DevTools" (*applied automatically):');
        console.log('  Removes a tricky function that crashes the app if DevTools are open');
        console.log('- Enable "developer mode":');
        console.log('  ***');
        console.log('- Enable "debug mode"');
        console.log('  ***');
        console.log('- Auto open DevTools');
        console.log('  Open DevTools automatically every time you run Assistant');
        console.log('');

        console.log('Please select what FEATURES you want to ENABLE!');
        console.log('Don\'t worry, you can come back and restore defaults anytime!');
        console.log('');

        let featuresQuestions = [
            {
                type: 'confirm',
                name: 'enableDebugMode',
                message: 'Do you want enableDebugMode? (recommended)',
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
            Object.assign(features, answers);
            stage4(features);
        });
    });
}

function stage4(features) {
    console.log('');
    console.log(TARGET);
    console.log(features);
}

function stage5() {
    console.log();
}
