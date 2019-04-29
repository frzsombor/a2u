'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const { exec } = require('child_process');

const platforms = ['win32', 'darwin'];
const platform = process.platform;

// products: [
//     "DJI Assistant 2",
//     "DJI Assistant 2 For Mavic",
//     "DJI Assistant 2 For Phantom",
// ],

global.TARGET = {
    dir: null,
    type: null, // 'ALL' | 'Mavic' | 'Phantom'
    version: null,
};

if (!platforms.includes(platform)) {
    console.error('This operating system ('+ platform +') is not supported!');
    return;
}

inquirer.registerPrompt('filefolder', require('inquirer-filefolder-prompt'));

console.log('Welcome to %appname%, the latest DJI Assistant 2 unlocker!');

// Scan local dir for 'DJI Assistant 2.exe'
console.log(__dirname);
fs.readdirSync('.').forEach(file => {
    console.log(file);
});

// exec("dir", function (error, stdout, stderr) {
//     console.log('stdout: ' + stdout);
//     console.log('stderr: ' + stderr);
//     if (error !== null) {
//         console.log('exec error: ' + error);
//     }
// });

/*
inquirer.prompt({
  type: 'filefolder',
  name: 'file',
  message: 'Please select the file.',
  dialog: {
      type: 'OpenFileDialog',
      config: {
          'title': 'Open',
          //...
      },
  },
  validate: function(file) {
    if (file.length === 0) {
      return 'No file selected.';
    }
    return true;
  }
}).then(answers => {
  console.log(JSON.stringify(answers, null, '  '));
});
*/

