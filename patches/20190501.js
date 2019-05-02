'use strict';

module.exports = {
    removeDevToolsBan: {
        title: 'Remove "anti-DevTools" (*applied automatically)',
        question: null,
        description: 'Removes a tricky function that crashes the app if DevTools are open',
        enabled: true,
        commit: function(target) {
            console.log(target);
            console.log('Applying patch "removeDevToolsBan"...');
        },
        revert: function(target) {
            console.log('Reverting patch "removeDevToolsBan"...');
        },
    },
    enableDebugMode: {
        title: 'Enable "developer mode"',
        question: 'Do you want to enable "developer mode"?',
        description: '***',
        enabled: true,
        commit: function(target) {
            console.log('Applying patch "enableDebugMode"...');
        },
        revert: function(target) {
            console.log('Reverting patch "enableDebugMode"...');
        },
    },
    enableDeveloperMode: {
        title: 'Enable "debug mode"',
        question: 'Do you want to enable "debug mode"?',
        description: '***',
        enabled: false,
        commit: function(target) {
            console.log('Applying patch "enableDeveloperMode"...');
        },
        revert: function(target) {
            console.log('Reverting patch "enableDeveloperMode"...');
        },
    },
    showDevToolsOnStartup: {
        title: 'Auto open DevTools',
        question: 'Do you want to enable "Auto open DevTools"?',
        description: 'Open DevTools automatically every time you run Assistant',
        enabled: false,
        commit: function(target) {
            console.log('Applying patch "showDevToolsOnStartup"...');
        },
        revert: function(target) {
            console.log('Reverting patch "showDevToolsOnStartup"...');
        },
    },
};
