# mobi-app-data-uploader
Update the hosted feature services used by the Mobi app.

### Parameters
| Paramter        | Type           | Is Required  | Description |
| --------------- |:--------------:|:------------:|:-----------|
| username        | string         |    true      |  |
| password        | string         |    true      |  |
| arcgisOnlineFolder      | string         |    false      | Name of the ArcGIS Online folder where the items are stored |
| folderToProcess      | string         |    false      | Name of the folder to process, if this parameter is empty, the script will scan and process all folders in the data folder |


### Example

    ```
    node index.js --username=YOUR_USERNAME --password=YOUR_PASSWORD
    ```

    ```
    node index.js --username=YOUR_USERNAME --password=YOUR_PASSWORD --arcgisOnlineFolder=testing --folderToProcess=alashete
    ```