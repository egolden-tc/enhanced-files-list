import {
    LightningElement,
    api,
    wire,
    track
} from 'lwc';
import getRelatedFilesByRecordId from '@salesforce/apex/FilesListController.getRelatedFilesByRecordId';
import {
    ShowToastEvent
} from 'lightning/platformShowToastEvent';
import {
    NavigationMixin
} from 'lightning/navigation';


//Datatable Columns
const columns = [{
    label: 'File Name',
    fieldName: 'nameURL',
    type: 'url',
    sortable: true,
    typeAttributes: {
        label: {
            fieldName: 'Title'
        },
        target: '_self'
    },
}, {
    label: 'Type',
    fieldName: 'Type__c',
    type: 'text',
    sortable: true
}, {
    label: 'Category',
    fieldName: 'Category__c',
    type: 'text',
    sortable: true
}, {
    label: 'Expiration Date',
    fieldName: 'Expiration_Date__c',
    type: 'date',
    sortable: true
}];


export default class FilesList extends NavigationMixin(LightningElement) {
    @track visibleFiles = [];
    @track hiddenFiles = [];
    @track columns = columns;
    @track showFooter;
    @track defaultSortDirection = 'asc';
    @track sortDirection = 'asc';
    @track sortedBy;


    @api recordId;
    @api footerText = 'View More';
    @api icon;
    @api uploadFiles;
    @api objectApiName;
    @api numFiles;

    //Using the wire service to get the records returned by the Apex method
    @wire(getRelatedFilesByRecordId, {
        recordId: '$recordId'
    })
    wiredFilesList({
        error,
        data
    }) {

        //if data is returned, check if footer should display and pass data to getFilesToDisplay method
        if (data) {

            if (this.numFiles)
                this.showFooter = data.length > this.numFiles ? true : false;

            this.getFilesToDisplay(data).then(finalFiles => {
                //getFilesToDisplay returns a promise, use .then to access the result after it's done
                if (!this.numFiles) {
                    this.numFiles = 5;
                }
                //get the first numFiles number of finalFiles
                this.visibleFiles = finalFiles.slice(0, this.numFiles);
                this.hiddenFiles = finalFiles.slice(this.numFiles);
            })
        } else if (error) {
            window.console.log(error);
        }
    }

    //Defines the accepted file formats
    get acceptedFormats() {
        return ['.jpg', '.jpeg', '.png', '.svg', '.gif'];
    }

    //Defines success message/behavior for file upload
    handleUploadFinished() {
        this.dispatchEvent(new ShowToastEvent({
            title: `Success`,
            message: `Image(s) have been uploaded`,
            variant: 'success',
        }));
    }

    //Defines what should happen when View All is clicked--navigate to the View All Files list
    viewAll() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordRelationshipPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: this.objectApiName,
                relationshipApiName: 'AttachedContentDocuments',
                actionName: 'view'
            },
        });

    }

    viewMore() {
        //when clicked, move the next numFiles number of files into visibleFiles from hiddenFiles
        let newVisibleFiles = this.hiddenFiles.slice(0, this.numFiles);
        this.visibleFiles = [...this.visibleFiles, ...newVisibleFiles];

        //remove the first numFiles number of files from hiddenFiles by keeping numFiles to the end
        this.hiddenFiles = this.hiddenFiles.slice(this.numFiles);

        //set showFooter to false if hiddenFiles = 0
        if (this.hiddenFiles.length === 0) {
            this.showFooter = false;

        }
    }

    //Use lightning-navigation service to generate the File URL for each File
    //Asynchronous and returns a promise
    getURL(fileId) {
        return this[NavigationMixin.GenerateUrl]({
            type: 'standard__recordPage',
            attributes: {
                recordId: fileId,
                actionName: 'view',
            },
        });

    }

    //Takes the data from the wire service and iterate over the list to define the column data and get the URL
    //Asynchronous and returns a promise
    getFilesToDisplay = async (sourceFiles) => {

        let updatedFileList = [];
        await this.asyncForEach(sourceFiles, async (row) => {

            let rowData = {};

            rowData.nameURL = await this.getURL(row.ContentDocumentId);
            rowData.Title = row.Title;
            rowData.Type__c = row.Type__c;
            rowData.Category__c = row.Category__c
            rowData.Expiration_Date__c = row.Expiration_Date__c


            updatedFileList.push(rowData);

        });

        return updatedFileList;
    }

    //This function is a utility to allow for an asynchronous for each (using await inside the for each block)
    //This is used in getFilesToDisplay
    asyncForEach = async (array, callback) => {
        // iterate passed in array and async function to call for each item
        for (let index = 0; index < array.length; index++) {
            // for each item in array, await completion of provided callback
            await callback(array[index], index, array);
        }
    }

    //Column sorting
    onHandleSort(event) {
        // field name
        this.sortedBy = event.detail.fieldName;

        // sort direction
        this.sortDirection = event.detail.sortDirection;

        // calling sortdata function to sort the data based on direction and selected field
        this.sortData(event.detail.fieldName, event.detail.sortDirection);
    }

    sortData(fieldname, direction) {
        // serialize the data before calling sort function
        let parseData = JSON.parse(JSON.stringify(this.visibleFiles));

        // Return the value stored in the field
        let keyValue = (a) => {

            if (fieldname === "nameURL") {
                return a.Title;
            } else {

                return a[fieldname];
            }
        };

        // checking reverse direction 
        let isReverse = direction === 'asc' ? 1 : -1;

        // sorting data 
        parseData.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : ''; // handling null values
            y = keyValue(y) ? keyValue(y) : '';

            // sorting values based on direction
            return isReverse * ((x > y) - (y > x));
        });

        // set the sorted data to data table data
        this.visibleFiles = parseData;

    }
}