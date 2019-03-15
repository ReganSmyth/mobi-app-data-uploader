'use strict';

// import required modules/dependencies
const request = require('request');

module.exports = function(){

    const state = {
        'username': '',
        'mainFolderID': '',
        'pdfFolderID': '',
        'token': '',
    };

    const init = async(options={
        username: '',
        password: '',
        mainfolderName: '',
        pdfFolderName: ''
    })=>{

        if(!options.username || !options.password || !options.mainfolderName || !options.pdfFolderName){
            console.error('username, password, main folder name and pdf folder Name are required to initiate API Manager');
            return;
        }

        setUsername(options.username);

        return new Promise(async(resolve, reject)=>{

            try {
                const token = await getToken(options.username, options.password);
                setToken(token);
    
                const folders = await getFolders();
                setFolderIDs(folders, options.mainfolderName, options.pdfFolderName);
    
                resolve('successfully initiated api manager');
    
            } catch (err){
                reject(err);
            }

        });

    };

    const setUsername = (username='')=>{
        state.username = username;
    };

    const setToken = (token='')=>{
        state.token = token;
        // console.log('token is set', state.token);
    };

    const setFolderIDs = (folders=[], mainfolderName, pdfFolderName)=>{
        // state.folderID = folderID;

        folders.forEach(folder=>{
            if(folder.title === mainfolderName){
                state.mainFolderID = folder.id;
            } else if(folder.title === pdfFolderName){
                state.pdfFolderID = folder.id;
            } else {
                // do nothing
            }
        });
    };

    const getToken = (username, password)=>{

        if(!username || !password){
            console.error('username and password are required to get token');
            return;
        }

        const url = getRequestUrl('generateToken');

        const formData = {
            username,
            password,
            referer: 'http://www.arcgis.com',
            f: 'json'
        };

        return new Promise(async(resolve, reject)=>{

            try {
                const res = await sendPostRequest(url, formData);

                if(res.token){
                    resolve(res.token)
                } else {
                    reject('failed to get token >>> invalide username or password');
                }
                // console.log('getToken response >>>', res);
            } catch (err){
                reject(err);
            }

        });

    };

    const getFolders = ()=>{

        const url = getRequestUrl('userContent');

        return new Promise(async(resolve, reject)=>{

            try {
                const res = await sendPostRequest(url);

                const folders = res.folders || [];

                resolve(folders)

                // console.log('getFolderID response >>>', res);
            } catch (err){
                reject(err);
            }

        });
    };

    const addFeatures = (url, features=[])=>{

        const formData = {
            features: JSON.stringify(features),
            token: state.token,
            f: 'json'
        };

        url = url + '/addFeatures';

        return new Promise(async(resolve, reject)=>{

            try {
                const res = await sendPostRequest(url, formData);

                if(res.error){
                    reject(`failed to add features to ${url}`);
                } else {
                    resolve(res)
                }
                // console.log('getToken response >>>', res);
            } catch (err){
                reject(err);
            }

        });
    };

    const updateFeatures = (url, features=[])=>{

        const formData = {
            features: JSON.stringify(features),
            token: state.token,
            f: 'json'
        };

        url = url + '/updateFeatures';

        return new Promise(async(resolve, reject)=>{

            try {
                const res = await sendPostRequest(url, formData);

                if(res.error){
                    reject(`failed to add features to ${url}`);
                } else {
                    resolve(res)
                }
                // console.log('getToken response >>>', res);
            } catch (err){
                reject(err);
            }

        });
    };

    const deleteFeatures = (url, where)=>{

        const formData = {
            where,
            token: state.token,
            f: 'json'
        };

        url = url + '/deleteFeatures';

        return new Promise(async(resolve, reject)=>{

            try {
                const res = await sendPostRequest(url, formData);

                if(res.error){
                    reject(`failed to delete features from ${url}`);
                } else {
                    resolve(res)
                }
            } catch (err){
                reject(err);
            }

        });
    };

    const addItemWithFile = (options={
        title: '',
        filename: '',
        type: '',
        file: null
    })=>{

        const url = options.type === 'PDF' ? getRequestUrl('addItem', { folderID: state.pdfFolderID }) : getRequestUrl('addItem');

        const formData = {
            // Pass a simple key-value pair
            title: options.title,
            filename: options.filename,
            type: options.type,
            // Pass data via Streams
            file: options.file,
            f: 'json',
            token: state.token
        };

        
        return new Promise(async(resolve, reject)=>{

            try {
                const res = await sendPostRequest(url, formData);

                if(res.error){
                    reject(`failed to add item >>> ${JSON.stringify(res.error)}`);
                } else {
                    resolve(res)
                }
            } catch (err){
                reject(err);
            }

        });
    };

    const analyzeItem = (options={
        itemID: '',
        filetype: ''
    })=>{

        const url = getRequestUrl('anazlye');

        const formData = {
            itemid: options.itemID,
            filetype: options.filetype,
            analyzeParameters: JSON.stringify({ 
                "enableGlobalGeocoding": 'false', 
                "sourceLocale":"en" 
            }),
            f: 'json',
            token: state.token
        };

        return new Promise(async(resolve, reject)=>{

            try {
                const res = await sendPostRequest(url, formData);

                if(res.error){
                    reject(`failed to analyze item >>> ${options.itemID}`);
                } else {
                    resolve(res)
                }
            } catch (err){
                reject(err);
            }

        });

    };

    const append = (url, options)=>{

        const appendRequestnUrl = url + '/append';

        const formData = {
            sourceTableName: options.sourceTableName,
            appendItemId: options.appendItemId,
            upsert: 'false',
            skipUpdates: 'false',
            useGlobalIds: 'false',
            skipInserts: 'false',
            updateGeometry: 'true',
            appendUploadFormat:	'filegdb',
            rollbackOnFailure:	'true',
            token: state.token,
            f: 'json',
        };

        const checkStatus = (requestUrl)=>{

            requestUrl = `${requestUrl}?f=json&token=${state.token}`;
        
            // console.log('checkStatusUrl', requestUrl);
        
            return new Promise((resolve, reject)=>{
        
                const sendRequest = ()=>{
        
                    request(requestUrl, function (error, response, body) {

                        body = JSON.parse(body);

                        // console.log('checkStatus response', body);

                        if(error){
                            reject(error);
                        }
            
                        if(body.status !== 'Completed'){
                            sendRequest();
                        } else {
                            resolve(body);
                        }
        
                    });
                };
            
                sendRequest();
            });
        };

        return new Promise(async(resolve, reject)=>{

            try {
                const appendRequestRes = await sendPostRequest(appendRequestnUrl, formData);

                if(appendRequestRes.error){
                    reject(`failed to execute append task >>> ${appendRequestnUrl}`);
                } else {

                    const checkStatusUrl = appendRequestRes.statusUrl || null;

                    if(!checkStatusUrl){
                        reject(`failed to execute append task >>> ${appendRequestnUrl}`);
                    }
    
                    const checkStatusResponse = await checkStatus(checkStatusUrl);

                    // console.log('checkStatusResponse', checkStatusResponse);
    
                    resolve(checkStatusResponse);

                }
            } catch (err){
                reject(err);
            }

        });
    };

    const deleteItem = (itemID, isPdf=false)=>{
        const url = isPdf ? getRequestUrl('deleteItem', { itemID, folderID: state.pdfFolderID }) : getRequestUrl('deleteItem', { itemID });

        return new Promise(async(resolve, reject)=>{

            try {
                const res = await sendPostRequest(url);

                if(res.error){
                    reject(`failed to delete item >>> ${itemID}`);
                } else {
                    resolve(res)
                }
            } catch (err){
                reject(err);
            }

        });
    };

    const queryFeatures = (url, where, returnCountOnly=false)=>{

        const formData = {
            where,
            // returnCountOnly: 'true',
            outFields: '*',
            token: state.token,
            f: 'json'
        };

        if(returnCountOnly){
            formData.returnCountOnly = 'true';
        };

        url = url + '/query';

        return new Promise(async(resolve, reject)=>{

            try {
                const res = await sendPostRequest(url, formData);

                if(res.error){
                    reject(`failed to query features from ${url} >>> ${JSON.stringify(res.error)}`);
                } else {
                    resolve(res)
                }
            } catch (err){
                reject(err);
            }

        });
    };

    const shareItem = async(itemID)=>{

        const url = getRequestUrl('shareItem');
        const formData = {
            items: itemID,
            everyone: 'true',
            token: state.token,
            f: 'json'
        };

        return new Promise(async(resolve, reject)=>{

            try {
                const res = await sendPostRequest(url, formData);
    
                if(res.error){
                    reject(`failed to share item: ${itemID} >>> ${JSON.stringify(res.error)}`);
                } else {
                    resolve(res)
                }
            } catch (err){
                reject(err);
            }

        });

    };

    const sendPostRequest = (url, formData)=>{

        formData = formData || {
            f: 'json',
            token: state.token
        };

        return new Promise((resolve, reject)=>{

            request.post({ url, formData }, (error, httpResponse, body)=>{
                if (!error && httpResponse.statusCode == 200) {
                    resolve(JSON.parse(body));
                } else {
                    reject(error);
                }
            });
    
        });
    };

    const getRequestUrl = (operationName='', options={
        itemID: '',
        folderID: '',
    })=>{

        const itemID = options.itemID;
        const folderID = options.folderID || state.mainFolderID;
        
        const rootURL = 'https://www.arcgis.com/sharing/rest';
        const userContentURL = `${rootURL}/content/users/${state.username}`;
        const userFolderURL = `${userContentURL}/${folderID}`;

        const requestURLs = {
            'generateToken': `${rootURL}/generateToken`,
            'userContent': userContentURL,
            'addItem': `${userFolderURL}/addItem`,
            'anazlye': `${rootURL}/content/features/analyze`,
            'deleteItem': `${userFolderURL}/items/${itemID}/delete`,
            'shareItem': `${userContentURL}/shareItems`
        };

        return requestURLs[operationName];
    };

    return {
        init,
        addFeatures,
        deleteFeatures,
        addItemWithFile,
        analyzeItem,
        append,
        deleteItem,
        queryFeatures,
        updateFeatures,
        shareItem
    };
}