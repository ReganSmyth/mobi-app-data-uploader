const checkParamters = (argv={})=>{

    const parameters = [
        {
            key: 'username',
            isRequired: true
        },
        {
            key: 'password',
            isRequired: true
        },
        {
            key: 'folderToProcess',
            isRequired: false
        },
        {
            key: 'arcgisOnlineMainFolder',
            isRequired: false
        },
        {
            key: 'arcgisOnlinePdfFolder',
            isRequired: false
        }
    ];

    let isAllParamsValide = true;

    for(let i = 0, len = parameters.length; i < len ; i++){
        const item = parameters[i];

        if(item.isRequired && !argv[item.key]){
            console.error('missing parameter: "' + item.key + '" is required');
            isAllParamsValide = false;
            break;
        }
    }

    return isAllParamsValide;
};

const getFolderName = (dirPath='')=>{
    const parts = dirPath.split('/');
    return parts[parts.length - 1];
};

module.exports = {
    checkParamters,
    getFolderName
};