// JavaScript source code

/* Functionality
 * Find all records where ASIT tracking ID != null and Signature Document = null
 * Create separate list of tracking numbers only
 *		Call GetFileNamesTrackingID/current date (or last Monday before today)
 *			Returns list of tracking number/fileName
 *			If list length returned is less than the list we sent, 
 *				find the last Monday of the previous year and call GetFileNamesTrackingID with that monday
 *			Concatenate the lists
 *			Update the record list with correct filenames
 * Go through each record and get pod file, upload the file to the record and add a link to ASIT .
 * 
 */

//Test Data
aa.env.setValue("tocFileDateToRun", "01/18/2021")
aa.env.setValue("useParamDate", "true")

//Get params from batch job
var tocFileToRun = aa.env.getValue("tocFileDateToRun")
var useParamDate = aa.env.getValue("useParamDate")
var dateStringForFileName = "";
var today = new Date();

if (useParamDate == "true") {

    var fileDate = new Date(tocFileToRun);
    //formatDate - MMDDYY
    dateStringForFileName = aa.util.formatDate(fileDate, "MMDDYY")
}
else {

    //formatDate - MMDDYY
    dateStringForFileName = aa.util.formatDate(today, "MMDDYY")
}

aa.print(dateStringForFileName)

//Find all records where ASIT tracking ID != null and Signature Document = null
var capArray = new Array();
var currentUserID = "ADMIN"
var capId = null;

//Start process
getCapsFromDB()
aa.print("Number of records to process: " + capArray.length)
mainProcess()


function mainProcess() {

    if (capArray.length == 0) {
        logDebug("No records to process. Exiting")
        return;
    }
    var trackingIDsForWebService = "";
    for (x in capArray) {
        aa.print(capArray[x].B1_PER_ID1 + "-" + capArray[x].B1_PER_ID2 + "-" + capArray[x].B1_PER_ID3 + " " + capArray[x].TrackingID + " " + capArray[x].FileName)
        if (x < capArray.length - 1) {
            trackingIDsForWebService += capArray[x].TrackingID + ',';
        }
        else {
            trackingIDsForWebService += capArray[x].TrackingID
        }
    }
    aa.print(trackingIDsForWebService)
   
    var fileName = "toc" + dateStringForFileName + ".pdf"
    var webServiceReturn = callPDFService("GetFileNamesTrackingID", fileName, trackingIDsForWebService)
   
    //need to parse the string twice to get it into JSON object because the return is ecapsulated in quotes and escapes
    //EG result "{\"9171999991703876895656\":\"pod0104210001\",\"9171999991703876895663\":\"pod0111210001\"}"
    var returnObj = JSON.parse(webServiceReturn)
    aa.print("returnObj " + returnObj)
    
    var finalObj = JSON.parse(returnObj)
    if (finalObj.length == 0) {
        logDebug("No file returned from USPS")
        return;
    }
    logDebug("returnObj " + finalObj)
    for (x in finalObj) aa.print(x + ":" + finalObj[x])
    
    logDebug(Object.keys(finalObj).length)
    
    for (z in capArray) {
        logDebug(capArray[z].TrackingID)
        capArray[z].FileName = finalObj[capArray[z].TrackingID]
        logDebug(capArray[z].FileName)
    }

    ////Did we get all of the filenames that we wanted?
    if (Object.keys(finalObj).length != capArray.length) {
        //Possible missing items from the year before
        //Call web service again with last file dated last Monday of the year before
        logDebug("missed some files. checking from last year")
        dateString = "122820"
        var lastMondayOfYear = getLastMondayOfYear(today.getFullYear() - 1)
        var dateString = (lastMondayOfYear.getMonth() + 1).toString() + lastMondayOfYear.getDate().toString() + lastMondayOfYear.getFullYear().toString().substring(0, 2);
        aa.print("lastMondayOfYear" + dateString)
        var fileName = "toc" + dateString + ".pdf"
        var webServiceReturn = callPDFService("GetFileNamesTrackingID", fileName, trackingIDsForWebService)
        var returnObj = JSON.parse(webServiceReturn)
        var finalObj = JSON.parse(returnObj)
        for (x in finalObj) aa.print(x + ":" + finalObj[x])
        logDebug(Object.keys(finalObj).length)
        
        for (z in capArray) {
            if (capArray[z].FileName === undefined || capArray[z].FileName === "undefined") {

                capArray[z].FileName = finalObj[capArray[z].TrackingID]     
            }
            logDebug(capArray[z].TrackingID)
            logDebug(capArray[z].FileName)
        }
    }

    //At this point we have the capArray all set to get documents and attach to record
    for (x in capArray) {
        aa.print(capArray[x].B1_PER_ID1 + "-" + capArray[x].B1_PER_ID2 + "-" + capArray[x].B1_PER_ID3);
        //continue
        var capId = aa.cap.getCapID(capArray[x].B1_PER_ID1, capArray[x].B1_PER_ID2, capArray[x].B1_PER_ID3).getOutput();
        //REC21-00000-00011 = DEM-21-00001
        
        if (capArray[x].FileName === undefined || capArray[x].FileName === "undefined") {

            logDebug("no file to upoad")
            continue;
        }
        aa.print("get document for AltID: " + capId.getCustomID() + " Filename: " + capArray[x].FileName)
        //Use HttpClient here because return from callPDFService is somehow corrupted with the bytes returned
        var docBytes = callHttpClient("GetConfirmationDocument", capArray[x].FileName + ".pdf", capArray[x].TrackingID);
        
        if (!docBytes) {
            continue;
        }
        if (docBytes.length == 0) {
            logDebug("No file returned from USPS")
            continue;
        }
        
        uploadDocumentToRecord(capId, capArray[x].FileName, capArray[x].TrackingID, docBytes)
       
        var documentID = null;
        var documentKey = null;
        var documentList = aa.document.getCapDocumentList(capId, currentUserID).getOutput()
        for (y in documentList) {
            logDebug("documentList[y].getFileName() " + documentList[y].getFileName())
            if (documentList[y].getFileName() == capArray[x].TrackingID + ".pdf") {

                documentID = documentList[y].getDocumentNo();
                documentKey = documentList[y].getFileKey();
                break;
            }
        }
        if (!documentID) {

            logDebug("Could not find document in Accela. Doc Name: " + capArray[x].TrackingID + ".pdf")
            continue;
        }

        //build URL string
        var currentEnvURL = lookup("WINSALEM_SETTINGS_USPS", "CURRENT_ENV_URL");

        var uploadURL = currentEnvURL + "/portlets/document/adobeDoc.do?mode=download&documentID=" + documentID + "&fileKey=" + documentKey + "&source=ADS&edmsType=ADS&haveDownloadRight=yes&refFrom=document&entityID=" + capArray[x].B1_PER_ID1 + "-" + capArray[x].B1_PER_ID2 + "-" + capArray[x].B1_PER_ID3 + "&altID=" + capId.getCustomID() + "&entityType=CAP&module=Enforcement&fileName=" + capArray[x].TrackingID + ".pdf";
        //Add link to table
        var USPSTable = loadASITable("USPS TRACKING", capId);

    	for (var x in USPSTable) {

            USPSTable[x]["Signature Document"] = uploadURL;
    	}
    	removeASITable("USPS TRACKING", capId);
    	addASITable("USPS TRACKING", USPSTable, capId);
    }
    //Delete all of the files on the service
    callPDFService("DeleteFile", "null", "1");
}

function uploadDocumentToRecord(capId, docName, trackingID, bytes) {

    var path = "c:\\temp\\" + trackingID + ".pdf";

    try {
        fout = aa.io.FileOutputStream(path);
        logDebug(bytes)
        fout.write(bytes);
        fout.flush();
        fout.close();
        logDebug("saved to Disc")
    }
    catch (ex) {
        logDebug("error saving doc to disc: " + ex.message)
        return;
    }

    var documentObject = aa.document.newDocumentModel().getOutput()
    var tmpEntId = capId.getID1() + "-" + capId.getID2() + "-" + capId.getID3();
    aa.print(tmpEntId)
    documentObject.setDocumentNo(null);
    documentObject.setCapID(capId)
    documentObject.setEntityID(tmpEntId);
    documentObject.setDocName(trackingID + ".pdf") //toc120720_test.pdf
    documentObject.setFileName(trackingID + ".pdf");
    documentObject.setSource("ADS")
    documentObject.setSourceName("ADS")
    documentObject.setDocCategory("Supporting Document")
    documentObject.setDocGroup("ENF_GENERAL")
    documentObject.setDocType("application/pdf")
    documentObject.setServiceProviderCode("WINSALEM")
    documentObject.setSocComment("Accela Document Service")
    documentObject.setRecStatus("A")
    documentObject.setDocDepartment("WINSALEM/ADMIN/NA/NA/NA/NA/NA")

    // Open and process file
    try {

        // put together the document content - use java.io.FileInputStream
        var newContentModel = aa.document.newDocumentContentModel().getOutput();
        inputstream = aa.io.FileInputStream(path);
        newContentModel.setDocInputStream(inputstream);
        documentObject.setDocumentContent(newContentModel);
        var newDocResult = aa.document.createDocument(documentObject);
        if (newDocResult.getSuccess()) {
            newDocResult.getOutput();
            logDebug("Successfully copied document: " + documentObject.getFileName());
        }
        else {
            logDebug("Failed to copy document: " + documentObject.getFileName());
            logDebug(newDocResult.getErrorMessage());
        }
    }
    catch (err) {
        logDebug("Error copying document: " + err.message);
        return false;
    }
    finally {
        logDebug("Delete the document");
        aa.util.deleteFile(path);
    }
}


function lookup(stdChoice, stdValue) {
    var strControl;
    var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice, stdValue);

    if (bizDomScriptResult.getSuccess()) {
        var bizDomScriptObj = bizDomScriptResult.getOutput();
        strControl = "" + bizDomScriptObj.getDescription(); // had to do this or it bombs.  who knows why?
    }
    return strControl;
}

function callPDFService(serviceName, fileName, trackingIDsForWebService) {

    try {
        //var apiURL = "https://accelauspsservicetest.cityofws.org/api/PDFRetrieve/GetFileNamesTrackingID/toc011121.pdf/9171999991703876895663,9171999991703876895700,9171999991703876895793,9171999991703876895656"; //use lookup("ProjectDox_Configuration", "CreateProjectURL")66443410http://192.168.1.69/api/PDFRetrieve/
        
        var apiURL = lookup("WINSALEM_SETTINGS_USPS", "PDF_SERVICE_URL");
        apiURL = apiURL + serviceName + "/" + fileName + "/" + trackingIDsForWebService;
        var authorization = lookup("WINSALEM_SETTINGS_USPS", "PDF_SERVICE_AUTHORIZATION")
        var headers = aa.util.newHashMap();
        headers.put("Content-Type", "application/json");
        headers.put("Authorization", authorization);
        logDebug("Calling DDF Service: " + apiURL)
        var result = aa.httpClient.get(apiURL, headers);
        
        logDebug("result " + result.getSuccess())
        if (result.getSuccess()) {
            result = result.getOutput();
            
            return result;
        } else {
            logDebug("Error calling PDF service: " + result.getErrorMessage());
            return null;
        }
    }
    catch (ex) {
        logDebug(ex.message)
    }
}

//function deleteFilesPDFService(serviceName, fileName) {

//    try {
        
//        var apiURL = lookup("WINSALEM_SETTINGS_USPS", "PDF_SERVICE_URL");
//        apiURL = apiURL + serviceName + "/" + fileName + "/1";
//        var authorization = lookup("WINSALEM_SETTINGS_USPS", "PDF_SERVICE_AUTHORIZATION")
//        var headers = aa.util.newHashMap();
//        headers.put("Content-Type", "application/json");
//        headers.put("Authorization", authorization)
//        logDebug("Calling to create project with URL: " + apiURL)
//        var result = aa.httpClient.post(apiURL, headers);

//        logDebug("result " + result.getSuccess())
//        if (result.getSuccess()) {
//            result = result.getOutput();
//            logDebug("Files on  server deleted ")
//            return result;
//        } else {
//            logDebug("Error deleting files on server: " + result.getErrorMessage());
//            return null;
//        }
//    }
//    catch (ex) {
//        logDebug(ex.message)
//    }
//}

function callHttpClient(serviceName, fileName, trackingIDsForWebService) {

    title = "JSON GET document";
    try {
        var apiURL = lookup("WINSALEM_SETTINGS_USPS", "PDF_SERVICE_URL");
        url = apiURL + serviceName + "/" + fileName + "/" + trackingIDsForWebService;
       // url = "https://accelauspsservicetest.cityofws.org/api/PDFRetrieve/GetConfirmationDocument/pod0111210001.pdf/9171999991703876895663";
        var authorization = lookup("WINSALEM_SETTINGS_USPS", "PDF_SERVICE_AUTHORIZATION")
        headers = {
            "Content-Type": "application/json",
            "Authorization": authorization
        };
       
        resp = httpClient(url, 'GET', headers);
        //displayResults(resp, title);
        var response = resp.getOutput();
        if (response.resultCode == "200") {
            return response.result;
        }
        else {
            var resultCode = httpStatusCodeMessage(response.resultCode)
            logDebug("Error getting document from PDF service. ResultCode: " + resultCode)
            return null;
        }
        
    } catch (err) {
        displayError(err, title);
        return null;
    }
}

function getCapsFromDB() {
    var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
    var ds = initialContext.lookup("java:/WINSALEM");
    var conn = ds.getConnection();
    
    var servProvCode = aa.getServiceProviderCode();
    try {
        //var SQL = "Select * From BAPPSPECTABLE_VALUE Where COLUMN_NAME = 'Signature Document' And SERV_PROV_CODE = 'WINSALEM'"
        //var SQL = "Select * From BAPPSPECTABLE_VALUE sg Where sg.COLUMN_NAME = 'Signature Document' And (sg.TTRIBUTE_VALUE Is Null Or sg.ATTRIBUTE_VALUE = '') And SERV_PROV_CODE = 'WINSALEM'"
        var SQL = "Select sg.B1_PER_ID1 as B1_PER_ID1, sg.B1_PER_ID2 as B1_PER_ID2, sg.B1_PER_ID3 as B1_PER_ID3,sg.ATTRIBUTE_VALUE as signature, tn.ATTRIBUTE_VALUE as tracking, sg.B1_PER_ID3 From BAPPSPECTABLE_VALUE sg Inner Join (Select * From BAPPSPECTABLE_VALUE Where COLUMN_NAME = 'Tracking Number' And ATTRIBUTE_VALUE Is Not Null And SERV_PROV_CODE = 'WINSALEM')tn On sg.B1_PER_ID3 = tn.B1_PER_ID3 Where sg.COLUMN_NAME = 'Signature Document' And (sg.ATTRIBUTE_VALUE Is Null Or sg.ATTRIBUTE_VALUE = '') And sg.ROW_INDEX = tn.ROW_INDEX And sg.SERV_PROV_CODE = 'WINSALEM'"
        //var SQL = "Select * From BAPPSPECTABLE_VALUE tn Where COLUMN_NAME = 'Tracking Number' And ATTRIBUTE_VALUE Is Not Null And SERV_PROV_CODE = 'WINSALEM'"
        var dbStmt = conn.prepareStatement(SQL);

        dbStmt.executeQuery();
        results = dbStmt.getResultSet()
        while (results.next()) {
            var thisCap = new capsAndTracking();
            //aa.print(results.getString("ATTRIBUTE_VALUE"))
            //aa.print(results.getString("COLUMN_NAME"))
            //aa.print(results.getString("B1_PER_ID1"))
            //aa.print(results.getString("B1_PER_ID2"))
            //aa.print(results.getString("B1_PER_ID3"))
            thisCap.B1_PER_ID1 = results.getString("B1_PER_ID1");
            thisCap.B1_PER_ID2 = results.getString("B1_PER_ID2");
            thisCap.B1_PER_ID3 = results.getString("B1_PER_ID3");
            thisCap.TrackingID = results.getString("tracking").trim();
            thisCap.FileName = results.getString("signature");
            capArray.push(thisCap)
        }
        dbStmt.close();
    }
    catch (err) {
        logDebug(err.message);
        if (typeof dbStmt != "undefined") dbStmt.close();
    }
    finally {

        conn.close()
    }
}

function getLastMondayOfYear(year) {
    var lastDayOfYear = new Date(year, "11", "31")
    var currentWeekDay = lastDayOfYear.getDay();
    var monday = lastDayOfYear.getDate() - (currentWeekDay - 1);
    var mondayDate = new Date(year, "11", monday)
    return mondayDate;
}

function logDebug(z) {
    aa.print(z)
}

/** Gets records by tracking ID */
//var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
//var ds = initialContext.lookup("java:/WINSALEM");
//var conn = ds.getConnection();
////Unable to get managed connection for java:/AA
////conn.close()
//var servProvCode = aa.getServiceProviderCode();
//try {
//    var SQL = "Select * From BAPPSPECTABLE_VALUE Where COLUMN_NAME = 'Tracking Number' And ATTRIBUTE_VALUE In " + trackingNumber + " And SERV_PROV_CODE = 'WINSALEM'"
//    var dbStmt = conn.prepareStatement(SQL);

//    dbStmt.executeQuery();
//    results = dbStmt.getResultSet()
//    while (results.next()) {
//        var thisCap = new capsAndTracking();
//        aa.print(results.getString("ATTRIBUTE_VALUE"))
//        aa.print(results.getString("COLUMN_NAME"))
//        aa.print(results.getString("B1_PER_ID1"))
//        aa.print(results.getString("B1_PER_ID2"))
//        aa.print(results.getString("B1_PER_ID3"))
//        thisCap.B1_PER_ID1 = results.getString("B1_PER_ID1");
//        thisCap.B1_PER_ID2 = results.getString("B1_PER_ID2");
//        thisCap.B1_PER_ID3 = results.getString("B1_PER_ID3");
//        thisCap.TrackingID = results.getString("ATTRIBUTE_VALUE");
//        capArray.push(thisCap)
//    }
//    dbStmt.close();
//}
//catch (err) {
//    logDebug(err.message);
//    if (typeof dbStmt != "undefined") dbStmt.close();
//}
//conn.close()


function capsAndTracking() {

    this.B1_PER_ID1 = "";
    this.B1_PER_ID2 = "";
    this.B1_PER_ID3 = "";
    this.TrackingID = "";
    this.FileName = "";
}

function removeASITable(tableName) // optional capId
{
    //  tableName is the name of the ASI table
    //  tableValues is an associative array of values.  All elements MUST be strings.
    var itemCap = capId
    if (arguments.length > 1)
        itemCap = arguments[1]; // use cap ID specified in args

    var tssmResult = aa.appSpecificTableScript.removeAppSpecificTableInfos(tableName, itemCap, currentUserID)

    if (!tssmResult.getSuccess()) { aa.print("**WARNING: error removing ASI table " + tableName + " " + tssmResult.getErrorMessage()); return false }
    else
        logDebug("Successfully removed all rows from ASI Table: " + tableName);

}

function addASITable(tableName, tableValueArray) // optional capId
{
    //  tableName is the name of the ASI table
    //  tableValueArray is an array of associative array values.  All elements MUST be either a string or asiTableVal object
    var itemCap = capId
    if (arguments.length > 2)
        itemCap = arguments[2]; // use cap ID specified in args

    var tssmResult = aa.appSpecificTableScript.getAppSpecificTableModel(itemCap, tableName)

    if (!tssmResult.getSuccess()) {
        logDebug("**WARNING: error retrieving app specific table " + tableName + " " + tssmResult.getErrorMessage());
        return false
    }

    var tssm = tssmResult.getOutput();
    var tsm = tssm.getAppSpecificTableModel();
    var fld = tsm.getTableField();
    var fld_readonly = tsm.getReadonlyField(); // get Readonly field

    for (thisrow in tableValueArray) {

        var col = tsm.getColumns()
        var coli = col.iterator();
        while (coli.hasNext()) {
            var colname = coli.next();

            if (!tableValueArray[thisrow][colname.getColumnName()]) {
                logDebug("addToASITable: null or undefined value supplied for column " + colname.getColumnName() + ", setting to empty string");
                tableValueArray[thisrow][colname.getColumnName()] = "";
            }

            if (typeof (tableValueArray[thisrow][colname.getColumnName()].fieldValue) != "undefined") // we are passed an asiTablVal Obj
            {
                fld.add(tableValueArray[thisrow][colname.getColumnName()].fieldValue);
                fld_readonly.add(tableValueArray[thisrow][colname.getColumnName()].readOnly);
                //fld_readonly.add(null);
            } else // we are passed a string
            {
                fld.add(tableValueArray[thisrow][colname.getColumnName()]);
                fld_readonly.add(null);
            }
        }

        tsm.setTableField(fld);

        tsm.setReadonlyField(fld_readonly);

    }

    var addResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, itemCap, currentUserID);

    if (!addResult.getSuccess()) {
        logDebug("**WARNING: error adding record to ASI Table:  " + tableName + " " + addResult.getErrorMessage());
        return false
    } else
        logDebug("Successfully added record to ASI Table: " + tableName);

}

function loadASITable(tname) {

    //
    // Returns a single ASI Table array of arrays
    // Optional parameter, cap ID to load from
    //

    var itemCap = capId;
    if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

    var gm = aa.appSpecificTableScript.getAppSpecificTableGroupModel(itemCap).getOutput();
    var ta = gm.getTablesArray()
    var tai = ta.iterator();

    while (tai.hasNext()) {
        var tsm = tai.next();
        var tn = tsm.getTableName();

        if (!tn.equals(tname)) continue;

        if (tsm.rowIndex.isEmpty()) {
            logDebug("Couldn't load ASI Table " + tname + " it is empty");
            return false;
        }

        var tempObject = new Array();
        var tempArray = new Array();

        var tsmfldi = tsm.getTableField().iterator();
        var tsmcoli = tsm.getColumns().iterator();
        var readOnlyi = tsm.getAppSpecificTableModel().getReadonlyField().iterator(); // get Readonly filed
        var numrows = 1;

        while (tsmfldi.hasNext())  // cycle through fields
        {
            if (!tsmcoli.hasNext())  // cycle through columns
            {
                var tsmcoli = tsm.getColumns().iterator();
                tempArray.push(tempObject);  // end of record
                var tempObject = new Array();  // clear the temp obj
                numrows++;
            }
            var tcol = tsmcoli.next();
            var tval = tsmfldi.next();
            var readOnly = 'N';
            if (readOnlyi.hasNext()) {
                readOnly = readOnlyi.next();
            }
            var fieldInfo = new asiTableValObj(tcol.getColumnName(), tval, readOnly);
            tempObject[tcol.getColumnName()] = fieldInfo;

        }
        tempArray.push(tempObject);  // end of record
    }
    return tempArray;
}

function asiTableValObj(columnName, fieldValue, readOnly) {
    this.columnName = columnName;
    this.fieldValue = fieldValue;
    this.readOnly = readOnly;
    this.hasValue = Boolean(fieldValue != null & fieldValue != "");

    asiTableValObj.prototype.toString = function () { return this.hasValue ? String(this.fieldValue) : String(""); }
};

//@ts-check
/*===========================================

Title : httpClient

Purpose : Replacement for the aa.util.httpPost

Author : Chris Hansen

Functional Area : Utilities

Description : Performs GET, POST, PUT transactions with custom headers, content, content type and encoding. Also includes a function for creating the content for a SOAP transaction and a function for interpreting HTTP Response codes.

Reviewed By : 

Script Type : (EMSE, EB, Pageflow, Batch) : EMSE

General Purpose/Client Specific : General Purpose

Client developed for : 

Parameters : See each function below.

=========================================== */

//FUNCTIONS//

/**
 * httpClient builds an Apache commons 3.1 httpclient for
 * the specified method and submits the request. It then 
 * takes the response and formats it into an AA Script Result
 * and returns.
 * 
 * @param {any} url - The endpoint URL
 * @param {any} method - HTTP method (POST, GET, PUT)
 * @param {any} headers - Array of header key value pairs. Key is header name, value is header value
 * @param {any} content - Needed for POST and sometimes PUT. String content of package
 * @param {any} contentType - Optional. if content type is omitted, value is set to text/xml
 * @param {any} encoding - Optional. If encoding is omitted, value is set to utf-8
 * @returns AA Script Result Object
 */
function httpClient(url, method, headers, content, contentType, encoding) {
    //content type and encoding are optional; if not sent use default values
    contentType = (typeof contentType != 'undefined') ? contentType : 'text/xml';
    encoding = (typeof encoding != 'undefined') ? encoding : 'utf-8';

    //build the http client, request content, and post method from the apache classes
    
    var httpClientClass = org.apache.commons.httpclient;
    var httpClient = new httpClientClass.HttpClient();

    switch (method.toUpperCase()) {
        case "POST":
            method = new httpClientClass.methods.PostMethod(url);
            break;
        case "GET":
            method = new httpClientClass.methods.GetMethod(url);
            content = "";
            break;
        case "PUT":
            method = new httpClientClass.methods.PutMethod(url);
            break;
        default:
            method = '';
    }

    if (typeof headers != 'undefined') {
        for (var key in headers) {
            method.setRequestHeader(key, headers[key]);
        }
    }

    if (typeof content != 'undefined' && content != '') {
        var requestEntity = new httpClientClass.methods.StringRequestEntity(content, contentType, encoding);
        method.setRequestEntity(requestEntity);
    }

    //set variables to catch and logic on response success and error type. build a result object for the data returned
    var resp_success = true;
    var resp_errorType = null;

    var resultObj = {
        resultCode: 999,
        result: null
    };

    //execute the http client call in a try block and once complete, release the connection
    try {
        resultObj.resultCode = httpClient.executeMethod(method);
        resultObj.result = method.getResponseBody();

    } finally {
        method.releaseConnection();
    }

    //if any response other than transaction success, set success to false and catch the error type string
    if (resultObj.resultCode.toString().substr(0, 1) !== '2') {
        resp_success = false;
        resp_errorType = httpStatusCodeMessage(resultObj.resultCode);
    }

    //create script result object with status flag, error type, error message, and output and return
    
    var scriptResult = new com.accela.aa.emse.dom.ScriptResult(resp_success, resp_errorType, resultObj.result, resultObj);

    return scriptResult;
}

/**
 * Takes a status code and returns the standard HTTP status code string
 *
 * @param {any} statusCode - Integer of the status code returned from an HTTP request.
 * @returns string description of HTTP status code
 */
function httpStatusCodeMessage(statusCode) {
    switch (statusCode) {
        case 100:
            return "100 - Continue";
        case 101:
            return "101 - Switching Protocols";
        case 200:
            return "200 - OK";
        case 201:
            return "201 - Created";
        case 202:
            return "202 - Accepted";
        case 203:
            return "203 - Non-Authoritative Information";
        case 204:
            return "204 - No Content";
        case 205:
            return "205 - Reset Content";
        case 206:
            return "206 - Partial Content";
        case 300:
            return "300 - Multiple Choices";
        case 301:
            return "301 - Moved Permanently";
        case 302:
            return "302 - Found";
        case 303:
            return "303 - See Other";
        case 304:
            return "304 - Not Modified";
        case 305:
            return "305 - Use Proxy";
        case 306:
            return "306 - (Unused)";
        case 307:
            return "307 - Temporary Redirect";
        case 400:
            return "400 - Bad Request";
        case 401:
            return "401 - Unauthorized";
        case 402:
            return "402 - Payment Required";
        case 403:
            return "403 - Forbidden";
        case 404:
            return "404 - Not Found";
        case 405:
            return "405 - Method Not Allowed";
        case 406:
            return "406 - Not Acceptable";
        case 407:
            return "407 - Proxy Authentication Required";
        case 408:
            return "408 - Request Timeout";
        case 409:
            return "409 - Conflict";
        case 410:
            return "410 - Gone";
        case 411:
            return "411 - Length Required";
        case 412:
            return "412 - Precondition Failed";
        case 413:
            return "413 - Request Entity Too Large";
        case 414:
            return "414 - Request-URI Too Long";
        case 415:
            return "415 - Unsupported Media Type";
        case 416:
            return "416 - Requested Range Not Satisfiable";
        case 417:
            return "417 - Expectation Failed";
        case 500:
            return "500 - Internal Server Error";
        case 501:
            return "501 - Not Implemented";
        case 502:
            return "502 - Bad Gateway";
        case 503:
            return "503 - Service Unavailable";
        case 504:
            return "504 - Gateway Timeout";
        case 505:
            return "505 - HTTP Version Not Supported";
    }
    return statusCode + " - Unknown Status Code";
}

function displayError(errorObj, title) {
    //@ts-ignore
    aa.print(title + " failed.");
    //@ts-ignore
    aa.print("Error name: " + errorObj.name);
    //@ts-ignore
    aa.print("Error message: " + errorObj.message);
}