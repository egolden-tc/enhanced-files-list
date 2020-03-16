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
    typeAttributes: {
        label: {
            fieldName: 'Title'
        },
        target: '_self',
        sortable: true
    },
}, {
    label: 'Type',
    fieldName: 'Type__c',
    type: 'text'
}, {
    label: 'Category',
    fieldName: 'Category__c',
    type: 'text'
}, {
    label: 'Expiration Date',
    fieldName: 'Expiration_Date__c',
    type: 'date'
}];


export default class filesList extends NavigationMixin(LightningElement) {
    @track files = [];
    @track columns = columns;


    @api recordId;
    @api footerText = 'View All';
    @api icon;
    @api uploadFiles;
    @api objectApiName;

    //Using the wire service to get the records returned by the Apex method
    @wire(getRelatedFilesByRecordId, {
        recordId: '$recordId'
    })
    wiredFilesList({
        error,
        data
    }) {

        //if data is returned, pass it to getFilesToDisplay method
        if (data) {

            this.getFilesToDisplay(data).then(finalFiles => {
                //getFilesToDisplay returns a promise, use .then to access the result after it's done
                this.files = finalFiles;
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



}