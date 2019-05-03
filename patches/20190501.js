'use strict';

module.exports = {
    removeDevToolsBan: {
        title: 'Remove "anti-DevTools" (*applied automatically)',
        description: 'Removes a tricky function that crashes the app if DevTools are open',
        question: null,
        enabled: true,
        patch: {
            file : 'asar',
            from : `banDevTools:function(e,t){var r,o=new Image;o.__defineGetter__("id",function(){r=!0}),window.devToolsTime=setInterval(function(){if(r=!1,console.log(o),r){var i=!0;for(window.ipcRenderer.send("open-devtools",i),e=null,t=null;i;);}},1e3)},`,
            to   : `banDevTools:function(e,t){var r,o=new Image;o.__defineGetter__("id",function(){r=!0}),window.devToolsTime=setInterval(function(){/*(r=!1,console.log(o),r){var i=!0;for(window.ipcRenderer.send("open-devtools",i),e=null,t=null;i;)*/},1e3)},`,
        },
    },
    enableDebugMode: {
        title: 'Enable "developer mode"',
        description: '***',
        question: 'Do you want to enable "developer mode"?',
        enabled: true,
        patch: {
            file : 'asar',
            from : `var debug = process.argv[2]=='debug'?true:false`,
            to   : `var debug = process.argv[2]=='debug'?true:true `,
        },
    },
    enableDeveloperMode: {
        title: 'Enable "debug mode"',
        description: '***',
        question: 'Do you want to enable "debug mode"?',
        enabled: false,
        patch: {
            file : 'localstorage',
            from : `debug=0`,
            to   : `debug=1`,
        },
    },
    showDevToolsOnStartup: {
        title: 'Auto open DevTools',
        description: 'Open DevTools automatically every time you run Assistant',
        question: 'Do you want to enable "Auto open DevTools"?',
        enabled: false,
        patch: {
            file : 'asar',
            from : `// mainWindow.webContents.openDevTools()`,
            to   : `   mainWindow.webContents.openDevTools()`,
        },
    },
};
