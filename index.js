'use strcit';

const argv = require('minimist')(process.argv.slice(2));
const APImanager = require('./src/API-Manager');
const FilesManager = require('./src/Files-Manager');
const Helper = require('./src/Helper');
const config = require('./src/config/main.json');

const apiManager = new APImanager();

const start = async()=>{

    if(!Helper.checkParamters(argv)){
        return;
    }

    try {

        await apiManager.init({
            username: argv.username,
            password: argv.password,
            folderName: argv.folderName
        });

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

            // TODO: retire the old overall and detailed comments; check the soubfolder name to make sure it matches one of the species name
    
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

    console.log(`start updating Modeling Extent for ${options.speciesCode}`);

    return new Promise(async(resolve, reject)=>{

        if(!options.fileName){
            // console.error('no .csv file found for modeling extent, skip updating modeling extent');
            resolve('no .csv file found for modeling extent, skip updating modeling extent');
        } else {
            // console.error('update modeling extent', fileName);

            try {
                const csvData = await FilesManager.readCSV(options.dirPath, options.fileName);

                if(csvData && csvData.length){
                    
                    const deleteFeaturesFromModelingExtentRes = await deleteFeaturesFromModelingExtent(options.speciesCode);
                    console.log('successfully deleted old features from modeling extent');

                    const addFeaturesToModelingExtentRes = await addFeaturesToModelingExtent(options.speciesCode, csvData);
                    console.log('successfully added features to modeling extent');

                    resolve(`sccessfully updated modeling extent for ${options.speciesCode}`);
                } else {
                    resolve(`invalide input .csv for ${options.speciesCode}`);
                }

            } catch(err){
                console.error(err);
                reject(err);
            }            
        }

    });

};

const addFeaturesToModelingExtent = async(speciesCode='', csvData=[])=>{

    const HUC_FIELD_NAME_CSV = config["fields-lookup"]["HUC"]["csv"];
    const HUC_FIELD_NAME_FEATURE_TABLE = config["fields-lookup"]["HUC"]["modeling-extent"];
    const SPECIES_FIELD_NAME_FEATURE_TABLE = config["fields-lookup"]["SpeciesCode"]["modeling-extent"];
    const url = config["hosted-feature-services"]["modeling-extent"]["layerURL"];

    const featuresToBeAdded = csvData.map(d=>{
        return {
            "attributes" : {
                [SPECIES_FIELD_NAME_FEATURE_TABLE]: speciesCode,
                [HUC_FIELD_NAME_FEATURE_TABLE]: d[HUC_FIELD_NAME_CSV]
            }
        };
    });

    return await apiManager.addFeatures(url, featuresToBeAdded);
};

const deleteFeaturesFromModelingExtent = async(speciesCode='')=>{
    const SPECIES_FIELD_NAME_FEATURE_TABLE = config["fields-lookup"]["SpeciesCode"]["modeling-extent"];
    const url = config["hosted-feature-services"]["modeling-extent"]["layerURL"];
    const where = `${SPECIES_FIELD_NAME_FEATURE_TABLE} = '${speciesCode}'`

    return await apiManager.deleteFeatures(url, where);
}; 



const updatePredictedHabitat = async(options={
    dirPath: '', 
    fileName: '',
    speciesCode: ''
})=>{

    console.log(`start updating Predicted Habitat for ${options.speciesCode}`, options);

    return new Promise(async(resolve, reject)=>{

        if(!options.fileName){
            // console.error('no .csv file found for predicted habitat, skip updating predicted habitat');
            resolve('no .zip file found for predicted habitat, skip updating predicted habitat');
        } else {
            // console.error('update predicted habitat', fileName);

            try {
                const zipFile = FilesManager.readFile(options.dirPath, options.fileName);

                if(zipFile){

                    console.log('zip file to process', zipFile);
                    
                    // const deleteFeaturesFromModelingExtentRes = await deleteFeaturesFromModelingExtent(options.speciesCode);
                    // console.log('successfully deleted old features from modeling extent');

                    // const addFeaturesToModelingExtentRes = await addFeaturesToModelingExtent(options.speciesCode, csvData);
                    // console.log('successfully added features to modeling extent');

                    // resolve(`sccessfully updated modeling extent for ${options.speciesCode}`);
                } else {
                    resolve(`invalide input .zip for ${options.speciesCode}`);
                }

            } catch(err){
                console.error(err);
                reject(err);
            }  


            resolve('update predicted habitat');
        }

    });

};


start();