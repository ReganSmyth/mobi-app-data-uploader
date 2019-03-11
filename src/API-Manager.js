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
            features,
            token: state.token,
            f: 'json'
        };

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

    const sendPostRequest = (url, formData)=>{

        formData = formData || {
            f: 'json',
            token: state.token
        };

        return new Promise((resolve, reject)=>{

            request.post({ url, formData }, (err, httpResponse, body)=>{
                body = JSON.parse(body);
    
                if (err) {
                    reject(err);
                }

                resolve(body);
            });
    
        });
    };

    const getRequestUrl = (operationName='')=>{
        
        const rootURL = 'https://www.arcgis.com/sharing/rest';
        const userContentURL = `${rootURL}/content/users/${state.username}`;

        const requestURLs = {
            'generateToken': `${rootURL}/generateToken`,
            'userContent': userContentURL
        }

        return requestURLs[operationName];
    };

    return {
        init,
        addFeatures
    };
}