'use strict';

const fs = require('fs');
const path = require("path");

module.exports = function(){

    const LOG_FILE_NAME = 'log.txt';
    const LOG_FILE_PATH = path.join(__dirname, `../${LOG_FILE_NAME}`);

    const init = ()=>{

        if (fs.existsSync(LOG_FILE_PATH)) {
            // Do something
            
        } else {
            console.log('log file dose not exist', LOG_FILE_PATH);
        }
    };

    const info = (msg)=>{

    };

    const error = (err)=>{

    };

    const save = (content)=>{

    };

    return {
        init,
        info,
        error,
    };

};