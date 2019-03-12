'use strict';

// import required modules/dependencies
const request = require('request');

module.exports = function(){

    const state = {
        'username': '',
        'folderID': '',
        'token': '',
    };

    const init = async(options={
        username: '',
        password: '',
        folderName: ''
    })=>{

        if(!options.username || !options.password || !options.folderName){
            console.error('username, password and folder name are required to initiate API Manager');
            return;
        }

        setUsername(options.username);

        return new Promise(async(resolve, reject)=>{

            try {
                const token = await getToken(options.username, options.password);
                setToken(token);
    
                const folderID = await getFolderID(options.folderName);
                setFolderID(folderID);
    
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

    const setFolderID = (folderID)=>{
        state.folderID = folderID;
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

    const getFolderID = (folderName)=>{

        if(!folderName){
            console.error('folder name is required to get the folder ID');
            return;
        }

        const url = getRequestUrl('userContent');

        return new Promise(async(resolve, reject)=>{

            try {
                const res = await sendPostRequest(url);

                const folders = res.folders || [];

                let folderId = '';

                folders.forEach(d=>{
                    if(d.title === folderName){
                        folderId = d.id;
                    }
                });
    
                if(folderId){
                    resolve(folderId);
                } else {
                    reject('no folder ID found for ' + folderName);
                }

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

        const url = getRequestUrl('addItem');

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

    const deleteItem = (itemID)=>{
        const url = getRequestUrl('deleteItem', itemID);

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

    const getRequestUrl = (operationName='', itemID='')=>{
        
        const rootURL = 'https://www.arcgis.com/sharing/rest';
        const userContentURL = `${rootURL}/content/users/${state.username}`;
        const userFolderURL = `${userContentURL}/${state.folderID}`

        const requestURLs = {
            'generateToken': `${rootURL}/generateToken`,
            'userContent': userContentURL,
            'addItem': `${userFolderURL}/addItem`,
            'anazlye': `${rootURL}/content/features/analyze`,
            'deleteItem': `${userFolderURL}/items/${itemID}/delete`
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
        deleteItem
    };
}