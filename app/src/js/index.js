'use strict';
const { ipcRenderer } = require('electron')
const { Tray, Menu } = require('electron').remote;

console.log(__dirname);

const Stats = require('./Stats');

/**
 * Main function of the browser window.
 */
function main () {
    // Creates a new "Stats" object and begins to get stats.
    const stats = new Stats();
    stats.start();
    
    // Create Tray Object. (Application Bar)
    let tray = null;
    if (process.platform === 'darwin') {
        tray = new Tray('/assets/tray-icon-alt.png');
    } else {
        tray = new Tray('/assets/tray-icon.png');
    }
    tray.setTitle('--');
    
    // Setup menu of tray.
    const trayMenuTemplate = [
        {
            label: 'Quit',
            click: () => {
                ipcRenderer.send('close-main-window');
            }
        }
    ];
    const trayMenu = Menu.buildFromTemplate(trayMenuTemplate);
    tray.setContextMenu(trayMenu);
    
    // Subscribe to the stats subject and wait for updates.
    stats.subject.subscribe({
        next: (x) => {
            // Create string to display stats.
            let statsString = '';
            x.forEach(element => {
                switch (element.command) {
                    case Stats.CPU_USED:
                        statsString += '[CPU: ' + element.value + '% ] ';
                        break;
                    case Stats.MEMORY_USED:
                        statsString += '[RAM: ' + element.value + 'GB ';
                        break;
                    case Stats.MEMORY_RESERVED:
                        statsString += '(' + element.value + 'GB)';
                        break;
                    case Stats.MEMORY_TOTAL:
                        statsString += ' / ' + '16' + ' GB]';
                        break;
                }
            });
            // Set tray title
            tray.setTitle(statsString);
        }
    });
    
}

main();
