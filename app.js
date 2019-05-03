'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const { exec } = require('child_process');

const analyzer = require('./lib/analyzer');
const compatcheck = require('./lib/compatcheck');
const patcher = require('./lib/patcher');

/* PREPARING */

const platforms = ['win32', 'darwin'];
const platform = process.platform;

if (!platforms.includes(platform)) {
    console.error('This operating system ('+ platform +') is not supported!');
    return;
}

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
currentDir = '/Applications';
// currentDir = 'd:\\Program Files (x86)\\DJI Assistant 2';
// currentDir = 'd:\\Program Files (x86)\\DJI Assistant 2 For Mavic';
// currentDir = 'd:\\Program Files (x86)\\DJI Assistant 2 For Phantom\\';
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

            compatcheck(results.type, results.version, function(compatibility, patchFile) {
                inquirer.prompt({
                    type: 'confirm',
                    name: 'acceptAutoDetect',
                    message: 'Would you like to use the unlocker on this application?',
                }).then(answers => {
                    console.log('');

                    if (answers.acceptAutoDetect) {
                        stage2(results, patchFile);
                        return;
                    }

                    stage1();
                });
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

    let msg = 'Select "' + CONFIG.target.name + '".';
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

            compatcheck(results.type, results.version, function(compatibility, patchFile) {
                if (compatibility !== 0) {
                    inquirer.prompt({
                        type: 'confirm',
                        name: 'forceRun',
                        message: 'Would you like to use the unlocker on this version?',
                    }).then(answers => {
                        console.log('');

                        if (answers.forceRun) {
                            stage2(results, patchFile);
                            return;
                        }

                        stage1();
                    });
                    return;
                }

                stage2(results, patchFile);
            });
        });
    });
}

function stage2(results, patchFile) {
    let target = results;

    let patch = require('./patches/' + patchFile + '.js');

    console.log('Target directory: ' + target.path);
    console.log('');

    //TODO: check if already patched (+restore)

    stage3(target, patch);
}

function stage3(target, patch) {
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
            stage4(target, patch);
            return;
        }

        console.log('');
        console.log('FEATURES LIST:');

        let features = Object.keys(patch);
        let featuresQuestions = [];

        features.forEach(key => {
            let feature = patch[key];

            if (feature.title) {
                console.log('- ' + feature.title);
                console.log('  ' + feature.description);
            }

            if (feature.question) {
                featuresQuestions.push({
                    type: 'confirm',
                    name: key,
                    message: feature.question,
                });
            }
        });

        console.log('');
        console.log('Please select what FEATURES you want to ENABLE!');
        console.log('Don\'t worry, you can come back and change them anytime!');
        console.log('');

        inquirer.prompt(featuresQuestions).then(answers => {
            let answersKeys = Object.keys(answers);
            answersKeys.forEach(key => {
                patch[key].enabled = answers[key];
            });
            stage4(target, patch);
        });
    });
}

function stage4(target, patch) {
    patcher.patch(target, patch, function() {
        console.log('');
        console.log('ALL DONE!');
        console.log('');
    });
}

