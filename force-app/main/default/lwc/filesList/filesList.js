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


export default class Test extends LightningElement {
    @track data = [];
    @track columns = columns;

    @api recordId;
    @api footerText = 'View All';


    @wire(getRelatedFilesByRecordId, {
        recordId: '$recordId'
    })
    wiredFilesList({
        error,
        data
    }) {
        if (data) {

            let currentData = [];

            data.forEach((row) => {


                let rowData = {};

                rowData.nameURL = '/lightning/r/ContentDocument/' + row.ContentDocumentId + '/view';
                rowData.Title = row.Title;
                rowData.Type__c = row.Type__c;
                rowData.Category__c = row.Category__c
                rowData.Expiration_Date__c = row.Expiration_Date__c


                currentData.push(rowData);

            });

            this.data = currentData;
        } else if (error) {
            window.console.log(error);
        }
    }

    get acceptedFormats() {
        return ['.jpg', '.jpeg', '.png', '.svg', '.gif'];
    }

    handleUploadFinished() {
        this.dispatchEvent(new ShowToastEvent({
            title: `Success`,
            message: `Image(s) have been uploaded`,
            variant: 'success',
        }));
    }

}