'use strcit';

const argv = require('minimist')(process.argv.slice(2));
const APImanager = require('./src/API-Manager');
const FilesManager = require('./src/Files-Manager');
const Helper = require('./src/Helper');
const config = require('./src/config/main.json');
// const config = require('./src/config/test.json');

const apiManager = new APImanager();

const start = async()=>{

    if(!Helper.checkParamters(argv)){
        return;
    }

    try {

        await apiManager.init({
            username: argv.username,
            password: argv.password,
            folderName: argv.arcgisOnlineFolder
        });

        scanDataFolder();

    } catch(err){
        console.error(err);
    }

};

const scanDataFolder = async(dataFolderPath='')=>{

    dataFolderPath = dataFolderPath || '../data';

    try {
        // get all sub folders in data folder if the argv.folderToProcess is not defined, the folder name should be the "species code" 
        const dataFolders = argv.folderToProcess ? [ argv.folderToProcess ]: await FilesManager.listFolders(dataFolderPath);
        // console.log(dataFolders);

        if(!dataFolders.length){
            console.log(`'${dataFolderPath}' folder is empty`);
            return;
        }

        if(argv.folderToProcess && !FilesManager.isExisted(`${dataFolderPath}/${argv.folderToProcess}`)){
            console.log(`invalide folderToProcess: directory ${argv.folderToProcess} does not exist`);
            return;
        }

        for(let i = 0, len = dataFolders.length ; i < len; i++){

            const subfolderName = dataFolders[i];
            const subfolderPath = `${dataFolderPath}/${subfolderName}`;
            const workingFiles = await FilesManager.getWorkingFiles(subfolderPath);
            // console.log(workingFiles);

            if(!await validateSpeciesCode(subfolderName)){
                console.log(`\nskip processing files in ${subfolderName}, the folder name: "${subfolderName}" does not match any species code...Make sure the folder name equals to a 'cutecode' in the Species Master lookup table and try again`);
            } else {
                console.log(`\nstart processing files in ${subfolderName} >>>`);

                const speciesCode = subfolderName;
        
                const updateModelingExtRes = await updateModelingExtent({
                    dirPath: subfolderPath, 
                    fileName: workingFiles["modeling-extent"],
                    speciesCode: speciesCode
                });
                console.log(updateModelingExtRes);
    
                const updatePredictedHabitatRes = await updatePredictedHabitat({
                    dirPath: subfolderPath, 
                    fileName: workingFiles["predicted-habitat"],
                    speciesCode: speciesCode
                });
                console.log(updatePredictedHabitatRes);

                const retireOldCommentRes = await retireOldComment(speciesCode);
                console.log(retireOldCommentRes);
            }
            
        }

        console.log('\nsuccessfully uploaded/processed all data folders.');

    } catch(err){
        console.log(err);
    }

};


const validateSpeciesCode = async(speciesCode='')=>{

    const SPECIES_FIELD_NAME_FEATURE_TABLE = config["fields-lookup"]["SpeciesCode"]["species-master-lookup"];
    const url = config["hosted-feature-services"]["species-master-lookup"]["layerURL"];
    const where = `${SPECIES_FIELD_NAME_FEATURE_TABLE} = '${speciesCode}'`;
    
    return new Promise(async(resolve, reject)=>{

        try {
            const queryRes = await apiManager.queryFeatures(url, where, true);
            // console.log(queryRes);
            const res = queryRes.count ? true : false;
            resolve(res);
        } catch(err){
            reject(err);
        }
    });
};

const retireOldComment = async(speciesCode='')=>{

    const tasks = [
        {
            url: config["hosted-feature-services"]["overall-feedback"]["layerURL"],
            tableName: 'overall-feedback'
        },
        {
            url: config["hosted-feature-services"]["detailed-feedback"]["layerURL"],
            tableName: 'detailed-feedback'
        }
    ]

    const exec = async(options={
        tableName: '' // "overall-feedback" | "detailed-feedback"
    })=>{

        const tableName = options.tableName;
        const url = options.url;

        try {
            const fieldNameSpecies = config["fields-lookup"]["SpeciesCode"][tableName];
            const fieldNamseRetirementDate = config["fields-lookup"]["RetirementDate"][tableName];
            const where = `${fieldNameSpecies} = '${speciesCode}' AND ${fieldNamseRetirementDate} IS NULL`;
    
            const queryRes = await apiManager.queryFeatures(url, where);
    
            if(queryRes.features && queryRes.features.length){
                    
                const currentTime = new Date();
    
                const featuresToUpdate = queryRes.features.map(d=>{
                    d.attributes[fieldNamseRetirementDate] = currentTime.getTime().toString();
                    return d;
                });
    
                const updateFeaturesResponse = await apiManager.updateFeatures(url, featuresToUpdate);
    
                return `successfully retired old feedback for ${speciesCode}`;
    
            } else {
                return `no feature found in ${tableName} table for ${speciesCode}, skip retire old comment step`;
            }
        }     
        catch(err){
            console.log(err);
            return err;
        }
    };

    return new Promise(async(resolve, reject)=>{
        for(let i = 0, len = tasks.length ; i < len; i++){
            const res = await exec(tasks[i]);
            console.log(res);
        }
        resolve(`succssfully retired all old comments associated with ${speciesCode}`);
    });
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
                    // console.log('successfully added features to modeling extent');

                    resolve({success: true, message: `sccessfully updated modeling extent for ${options.speciesCode}`});
                } else {
                    resolve(`invalide input .csv for ${options.speciesCode}`);
                }

            } catch(err){
                // console.error(err);
                resolve(err);
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

    console.log(`start updating Predicted Habitat for ${options.speciesCode}`);

    return new Promise(async(resolve, reject)=>{

        if(!options.fileName){
            // console.error('no .csv file found for predicted habitat, skip updating predicted habitat');
            resolve('no .zip file found for predicted habitat, skip updating predicted habitat');
        } else {
            // console.error('update predicted habitat', fileName);

            try {
                const zipFile = FilesManager.readFile(options.dirPath, options.fileName);

                if(zipFile){

                    // console.log('zip file to process', zipFile);

                    const serviceUrl = getUrlForPredictedHabitat(options.fileName);
                    if(!serviceUrl){
                        resolve('failed to retrieve service url for predicted habitat, make sure the .zip file name includes "-line" or "-poly" so we can determine the geometery type');
                    }
                    
                    const deleteFeaturesFromPredictedHabitatRes = await deleteFeaturesFromPredictedHabitat(serviceUrl, options.speciesCode);
                    console.log('successfully deleted old features from predicted habitat');

                    // add the input .zip file as a temporary item to ArcGIS Online
                    const addItemResponse = await apiManager.addItemWithFile({
                        title: 'agol_tempfile_' + options.fileName,
                        filename: options.fileName,
                        type: 'File Geodatabase',
                        file: zipFile
                    });
                    // console.log('addItemResponse', addItemResponse);

                    const tempItemID = addItemResponse.success && addItemResponse.id ? addItemResponse.id : null;

                    if(!tempItemID){
                        resolve('failed to add the file gdb as a temporary item on AGOL...');
                    }

                    // anaylze the temporary file gdb to get info needed for the append operation
                    const analyzeItemResponse = await apiManager.analyzeItem({ 
                        itemID: tempItemID,
                        filetype: 'fileGeodatabase' 
                    });
                    // console.log('analyzeItemResponse', analyzeItemResponse);

                    const layerInfo = analyzeItemResponse.publishParameters && analyzeItemResponse.publishParameters.layers && analyzeItemResponse.publishParameters.layers.length ? analyzeItemResponse.publishParameters.layers[0] :null;

                    if(!layerInfo){
                        resolve('failed to analyze the temporary file gdb...', analyzeItemResponse);
                    }

                    // TODO: fix this request url
                    const appendResponse = await apiManager.append(serviceUrl, { 
                        appendItemId: tempItemID, 
                        sourceTableName: layerInfo.name
                    });
                    // console.log('appendResponse', appendResponse);

                    await apiManager.deleteItem(tempItemID);
                    
                    resolve({success: true, message: `sccessfully updated predicted habitat for ${options.speciesCode}`});

                } else {
                    resolve(`invalide input .zip for ${options.speciesCode}`);
                }

            } catch(err){
                // console.error(err);
                resolve(err);
            }  
        }

    });

};

const deleteFeaturesFromPredictedHabitat = async(url, speciesCode='')=>{
    const SPECIES_FIELD_NAME_FEATURE_TABLE = config["fields-lookup"]["SpeciesCode"]["predicted-habitat"];
    // TODO: fix this request url
    // const url = config["hosted-feature-services"]["predicted-habitat-line"]["layerURL"];
    const where = `${SPECIES_FIELD_NAME_FEATURE_TABLE} = '${speciesCode}'`

    return await apiManager.deleteFeatures(url, where);
}; 

const getUrlForPredictedHabitat = (filename='')=>{

    const urlForLines = config["hosted-feature-services"]["predicted-habitat-line"]["layerURL"];
    const urlForPolygons = config["hosted-feature-services"]["predicted-habitat-poly"]["layerURL"];

    const regexpForLineFeatures = /-line/gi;
    const regexpForPolygonFeatures = /-poly|-polygon/gi;
    
    const isLine = regexpForLineFeatures.test(filename);
    const isPoly = regexpForPolygonFeatures.test(filename);

    if(isLine){
        return urlForLines
    } else if(isPoly){
        return urlForPolygons;
    } else {
        return null;
    }

};


start();