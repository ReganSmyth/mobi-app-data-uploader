# mobi-app-data-uploader
Update the hosted feature services used by the Mobi app.

### Parameters
| Paramter        | Type           | Is Required  | Description |
| --------------- |:--------------:|:------------:|:-----------|
| username        | string         |    true      |  |
| password        | string         |    true      |  |
| folderName      | string         |    true      | Name of the folder where the items will be updated |


### Example
    ```
    node index.js --username=YOUR_USERNAME --password=YOUR_PASSWORD --folderName=testing
    ```