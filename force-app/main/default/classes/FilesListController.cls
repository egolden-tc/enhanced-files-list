public with sharing class FilesListController {
   
    @AuraEnabled(cacheable=true)
    public static List<ContentVersion> getRelatedFilesByRecordId(String recordId){
       
        List<ContentDocumentLink> files = [SELECT ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId = :recordId];
        List<ID>fileIDs = new List<ID>();
        for (ContentDocumentLink fileLink : files){
            fileIDs.add(fileLink.ContentDocumentId);
        }
        List<ContentVersion> filesList = [SELECT ContentDocumentId, FileExtension, Title, Type__c, Category__c, Expiration_Date__c FROM ContentVersion WHERE ContentDocumentId IN :fileIDs];
        return filesList;

}
}