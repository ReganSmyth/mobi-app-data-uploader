const { readdir, stat } = require("fs").promises
const { join } = require("path");
const fs = require("fs");
const csvtojson = require("csvtojson");

const listFolders= async(dirPath='')=>{

    dirPath = join(__dirname, dirPath);

    let dirs = [];

    for (const file of await readdir(dirPath)) {
        if ((await stat(join(dirPath, file))).isDirectory()) {
            dirs = [...dirs, file];
        }
    }

    return dirs;
};

const listFiles = async(dirPath='')=>{
    dirPath = join(__dirname, dirPath);

    let files = [];

    for (const file of await readdir(dirPath)) {
        if (!(await stat(join(dirPath, file))).isDirectory()) {
            files = [...files, file];
        }
    }

    return files;
};

// get the .csv file for the modeling extent and .zip for the predicted habitat
const getWorkingFiles = async (dirPath)=>{
    const files = await listFiles(dirPath);
    // console.log('working files', files);

    const workingFiles = {};

    files.forEach(f=>{

        // const regexpForPredictedHabitat = /predicted-habitat+(\.zip)$/gi;
        // const regexpForModelingExt = /modeling-extent+(\.csv)$/gi;

        const regexpForPredictedHabitat = /(\.zip)$/gi;
        const regexpForModelingExt = /(\.csv)$/gi;

        if(f.match(regexpForPredictedHabitat)){
            workingFiles["predicted-habitat"] = f;
        } else if(f.match(regexpForModelingExt)){
            workingFiles["modeling-extent"] = f;
        } else {
            // do nothing
        }

    });

    return workingFiles;
};

const readCSV = async(csvFilePath, csvFileName)=>{
    csvFilePath = join(__dirname, csvFilePath, csvFileName);
    // console.log(csvFilePath);
    const jsonObj = await csvtojson().fromFile(csvFilePath);
    return jsonObj;
};

const readFile = (filePath, fileName)=>{
    return fs.createReadStream(join(__dirname, filePath, fileName)); 
};

module.exports = {
    listFolders,
    // listFiles,
    getWorkingFiles,
    readCSV,
    readFile
}