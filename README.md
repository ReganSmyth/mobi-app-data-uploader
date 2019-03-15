# mobi-app-data-uploader
Update the hosted feature services used by the Mobi app.

## Prerequisites
Before we begin, make sure you have a fresh version of [Node.js](https://nodejs.org/en/) and NPM installed. The current Long Term Support (LTS) release is an ideal starting point. 

## Installation
To begin, fork this repository and clone ir to your computer:
```sh
https://github.com/vannizhang/mobi-app-data-uploader.git
```

From the project's root directory, install the required packages (dependencies):

```sh
npm install
```

## Run Script
```
node index.js --username=YOUR_USERNAME --password=YOUR_PASSWORD
```

To run the script, open the command line program, navigate to the project's root directory and type `node index.js`, please make sure you pass the correct required parameters (`username` and `password`) when you run the script. 

In the project root folder, make sure you create a folder called `data`, that you will use to place the folders prepared for each species. For the folders in the `data` folder, the folder name should equal to the `cutecode` of the species.

example directory structure for the data folder:
```
|--data
    |--alashete
        |--modeling-extent.csv (it only has one field “HUC_10”)
        |--predictedhabitat-{line or poly}.gdb.zip (this should be a zipped file gdb; It should have one feature class)
        |--{cutecode}.pdf

    |--ellichip
        |--modeling-extent.csv
        |--predictedhabitat-{line or poly}.gdb.zip
        |--{cutecode}.pdf

    |--fuscburk
        |--modeling-extent.csv
        |--predictedhabitat-{line or poly}.gdb.zip
        |--{cutecode}.pdf

```

### Parameters
| Paramter        | Type           | Is Required  | Description |
| --------------- |:--------------:|:------------:|:-----------|
| username        | string         |    true      |  |
| password        | string         |    true      |  |
| folderToProcess      | string         |    false      | Name of the folder to process, if this parameter is empty, the script will scan and process all folders in the `./data` |
| arcgisOnlineMainFolder      | string         |    false      | Name of the ArcGIS Online folder where the hosted feature services for the app are stored, the default value is `MobiReviewApp` |
| arcgisOnlinePdfFolder      | string         |    false      | Name of the ArcGIS Online folder where the PDF files will be uploaded, the default value is `PDF`|



### Example
```
node index.js --username=YOUR_USERNAME --password=YOUR_PASSWORD --folderToProcess=alashete --arcgisOnlineMainFolder=FOLDER_NAME --arcgisOnlinePdfFolder=PDF_FOLDER_NAME 
```