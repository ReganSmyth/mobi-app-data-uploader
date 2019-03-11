'use strcit';

const argv = require('minimist')(process.argv.slice(2));
const APImanager = require('./src/API-Manager');
const FilesManager = require('./src/Files-Manager');
const Helper = require('./src/Helper');

const apiManager = new APImanager();

const start = async()=>{

    if(!Helper.checkParamters(argv)){
        return;
    }

    try {

        // await apiManager.init({
        //     username: argv.username,
        //     password: argv.password,
        //     folderName: argv.folderName
        // });

        scanDataFolder();

    } catch(err){
        console.error(err);
    }

};

const scanDataFolder = async(dataFolderPath='')=>{

    dataFolderPath = dataFolderPath || '../data';

    try {
        // get all sub folders in data folder, the folder name should be the "species code" 
        const dataFolders = await FilesManager.listFolders(dataFolderPath);
        // console.log(dataFolders);

        if(!dataFolders.length){
            console.log(`'${dataFolderPath}' folder is empty`);
            return;
        }

        for(let i = 0, len = dataFolders.length ; i < len; i++){

            const subfolderName = dataFolders[i];
            const subfolderPath = `${dataFolderPath}/${subfolderName}`;
            const workingFiles = await FilesManager.getWorkingFiles(subfolderPath);
            // console.log(workingFiles);

            console.log(`\nstart processing files in ${subfolderName}:`);
    
            const updateModelingExtRes = await updateModelingExtent({
                dirPath: subfolderPath, 
                fileName: workingFiles["modeling-extent"],
                speciesCode: subfolderName
            });

            const updatePredictedHabitatRes = await updatePredictedHabitat({
                dirPath: subfolderPath, 
                fileName: workingFiles["predicted-habitat"],
                speciesCode: subfolderName
            });
    
            // console.log(updateModelingExtRes);
            // console.log(updatePredictedHabitatRes);

        }

    } catch(err){
        console.log(err);
    }

};

const updateModelingExtent = async(options={
    dirPath: '', 
    fileName: '',
    speciesCode: ''
})=>{

    console.log('calling updateModelingExtent', options);

    return new Promise(async(resolve, reject)=>{

        if(!options.fileName){
            // console.error('no .csv file found for modeling extent, skip updating modeling extent');
            resolve('no .csv file found for modeling extent, skip updating modeling extent');
        } else {
            // console.error('update modeling extent', fileName);

            try {
                const csvData = await FilesManager.readCSV(options.dirPath, options.fileName);

                const featuresToBeAdded = csvData.map(d=>{
                    return {
                        "attributes" : {
                            "SpeiesCode": options.speciesCode,
                            "HUCID": d.HUC_10
                        }
                    };
                });

                console.log(featuresToBeAdded);
                
            } catch(err){
                console.error(err);
            }

            resolve('update modeling extent');
        }

    });

};

const updatePredictedHabitat = async(options={
    dirPath: '', 
    fileName: '',
    speciesCode: ''
})=>{

    console.log('calling updatePredictedHabitat', options);

    return new Promise((resolve, reject)=>{

        if(!!options.fileName){
            // console.error('no .csv file found for predicted habitat, skip updating predicted habitat');
            resolve('no .zip file found for predicted habitat, skip updating predicted habitat');
        } else {
            // console.error('update predicted habitat', fileName);
            resolve('update predicted habitat');
        }

    });

};


start();