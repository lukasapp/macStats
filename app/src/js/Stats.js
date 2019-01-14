'use strict';

const { spawn } = require('child_process');
const { Subject } = require('rxjs');

/**
 * Stats class:
 * Gets stats over "top" command and parses it correctly.
 * 
 * @author lukasapp
 */
class Stats {

    /**
     * Constructor.
     */
    constructor() {
        // Create subject, so that others can subscribe.
        this._subject = new Subject();

        // Bind functions to class object.
        this._parseStats = this._parseStats.bind(this);
    }

    /** 
     * Returns the subject sothat it can be subscribed to.
     */
    get subject() {
        return this._subject;
    }

    /**
     * Starts getting stats from "top" command.
     */
    start() {
        // How often to reload stats.
        const interval = 10;

        // Execute command and save it to "_child".
        this._child = spawn('top', ['-s', interval, '-stats', 'cpu']);
        // Set output encoding and "on data" listener.
        this._child.stdout.setEncoding('utf8');
        this._child.stdout.on('data', this._parseStats);
        // On close listener
        this._child.on('close', (code) => {
            console.info(`child "top" process exited with code ${code}`);
        });
    }

    /**
     * Stops the process of getting stats.
     */
    stop() {
        this._child.kill(0);
    }

    /**
     * @private
     * Parses the stats information from "top".
     * Information is deepending on the input "data" ("top").
     * 
     * @param {string} data 
     */
    _parseStats(data) {
        const response = [];
        // Lowercase the input.
        const split = data.toLowerCase().split('\n');

        // Go through the first 1-9 elements since these contain the overall status of the system.
        for (let i = 1; i < 9; i++) {
            // Get the header of the stats.
            const seperated = split[i].replace('(', ',').split(': ');
            // Make sure it exists.
            if (seperated.length !== 2) {
                continue;
            }
            // Remove all none nummeral characters (Except "," & ".").
            seperated[1] = seperated[1].replace(/[^0-9.,]/g, '');

            // Get header colum & values.
            const header = seperated[0];
            const values = this._toNumber(seperated[1].split(','));

            // Check what kind of stats are passed.
            switch (header) {
                // CPU
                case 'cpu usage':
                    response.push({
                        command: Stats.CPU_USED,
                        value: this._round(values[0] + values[1])
                    });
                    break;
                // RAM / Memory
                case 'physmem':
                    // Get the size (m = MegaBytes, g = GigaBytes) of the input
                    const seperatedTwo = split[i].replace('(', ',').split(': ');
                    const sizes = seperatedTwo[1].replace(/[^mg,]/g, '').split(',');
                    // Factor in the "size".
                    const memReserved = this._round(values[1] / sizes[1] === 'm' ? 1000 : 1);
                    const memUsedWithReserved = values[0] / (sizes[0] === 'm' ? 1000 : 1);
                    const memIdle = values[2] / (sizes[2] === 'm' ? 1000 : 1);

                    response.push({
                        command: Stats.MEMORY_USED,
                        value: this._round(memUsedWithReserved - memReserved)
                    });
                    response.push({
                        command: Stats.MEMORY_RESERVED,
                        value: memReserved
                    });
                    response.push({
                        command: Stats.MEMORY_TOTAL,
                        value: (memUsedWithReserved + memIdle).toFixed(0)
                    });
                    break;

            }
        }

        // Push to subscribers.
        this._subject.next(response);
    }

    /**
     * @private
     * Rounds the number and returns it with one decimal point.
     * 
     * @param {number} value 
     * @returns {string} 
     */
    _round(value) {
        const result = Math.round(value * 10) / 10;
        return result.toFixed(1);
    }

    /**
     * @private
     * Parses the array of string elements to a numbers array.
     * 
     * @param {string[]} array 
     * @returns {number[]} 
     */
    _toNumber(array) {
        const outputArray = [];
        for (let i = 0; i < array.length; i++) {
            outputArray[i] = Number(array[i]);
        }
        return outputArray;
    }

    /**
     * Const commands.
     */
    static get CPU_IDLE() { return 'CPU_IDLE'; }
    static get CPU_USED() { return 'CPU_USED'; }
    static get MEMORY_TOTAL() { return 'MEMORY_TOTAL'; }
    static get MEMORY_IDLE() { return 'MEMORY_IDLE'; }
    static get MEMORY_RESERVED() { return 'MEMORY_RESERVED'; }
    static get MEMORY_USED() { return 'MEMORY_USED'; }
}

module.exports = Stats;