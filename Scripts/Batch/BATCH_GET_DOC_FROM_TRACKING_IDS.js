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
 * Go through each record and get pod file if populated.
 * 
 */

//Test Data
aa.env.setValue("tocFileDateToRun", "01/11/2021")
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

    //GetFileNamesTrackingID
    //GetConfirmationDocument
   
    var fileName = "toc" + dateStringForFileName + ".pdf"
    var webServiceReturn = callPDFService("GetFileNamesTrackingID", fileName, trackingIDsForWebService)
   
    //var webServiceReturn = '{"9171999991703876895656":"pod0104210001","9171999991703876895663":"pod0111210001","9171999991703876895700":"pod0111210001","9171999991703876895793":"pod0111210001"}'
    //var webServiceReturn = '<string xmlns="http://schemas.microsoft.com/2003/10/Serialization/">{"9171999991703876895656":"pod0104210001","9171999991703876895663":"pod0111210001","9171999991703876895700":"pod0111210001","9171999991703876895793":"pod0111210001"}</string>'

    //need to parse the string twice to get it into JSON object because the return is ecapsulated in quotes and escapes
    //EG result "{\"9171999991703876895656\":\"pod0104210001\",\"9171999991703876895663\":\"pod0111210001\"}"
    var returnObj = JSON.parse(webServiceReturn)
    aa.print("returnObj " + returnObj)
    //return
    var finalObj = JSON.parse(returnObj)
    if (finalObj.length == 0) {
        logDebug("No file returned from USPS")
        return;
    }
    logDebug("returnObj " + finalObj)
    for (x in finalObj) aa.print(x + ":" + finalObj[x])
    
    logDebug(Object.keys(finalObj).length)
    //return
    //logDebug(returnObj["9171999991703876895656"])
    for (z in capArray) {
        logDebug(capArray[z].TrackingID)
        capArray[z].FileName = finalObj[capArray[z].TrackingID]
        logDebug(capArray[z].FileName)
    }

    ////Did we get all of the filenames that we wanted?
    if (Object.keys(finalObj).length != capArray.length) {
        //Possible missing items from the year before
        //Cal web service again with last file dated last Monday of the year before
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
        //logDebug(returnObj["9171999991703876895656"])
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
        var docBytes = callPDFService("GetConfirmationDocument", capArray[x].FileName + ".pdf", capArray[x].TrackingID)
        //var returnBytes = JSON.parse(docBytes)
        if (docBytes.length == 0) {
            logDebug("No file returned from USPS")
            continue;
        }
        logDebug(docBytes)
        //Upload to record
        uploadDocumentToRecord(capId, capArray[x].FileName, capArray[x].TrackingID, docBytes)
        //get document
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
        //itemCapModel.getModuleName();
        //https://winsalem-supp-av.accela.com/portlets/document/adobeDoc.do?mode=download            & documentID=24744232            & fileKey=A01000000292492I6RF9YUDVYVBXE3            & source=ADS            & edmsType=ADS            & haveDownloadRight=yes            & refFrom=document            & entityID=REC21-00000-00011            & altID=DEM-21-00001            & entityType=CAP            & module=Enforcement            & fileName=9171999991703876895663.pdf
        //Add link to table
        var USPSTable = loadASITable("USPS TRACKING", capId);

    	for (var x in USPSTable) {

            USPSTable[x]["Signature Document"] = uploadURL;
    	}
    	removeASITable("USPS TRACKING", capId);
    	addASITable("USPS TRACKING", USPSTable, capId);
    }
}
function strToUtf16Bytes(str) {
    const bytes = [];
    for (ii = 0; ii < str.length; ii++) {
        const code = str.charCodeAt(ii); // x00-xFFFF
        bytes.push(code & 255, code >> 8); // low, high
    }
    return bytes;
}

function uploadDocumentToRecord(capId, docName, trackingID, bytes) {

    var path = "c:\\temp\\" + docName + ".pdf";

    try {
        fout = aa.io.FileOutputStream(path);
        //Temp fix
        var converted = strToUtf16Bytes(bytes)
        fout.write(converted);
        //fout.write(bytes.bytes);
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
        //for (x in inputstream) aa.print(x)
        newContentModel.setDocInputStream(inputstream);
        documentObject.setDocumentContent(newContentModel);
        var newDocResult = aa.document.createDocument(documentObject);
        if (newDocResult.getSuccess()) {
            newDocResult.getOutput();
            logDebug("Successfully copied document: " + documentObject.getFileName());
            //logDebug("output: " + newDocResult.toString())
            //for (x in newDocResult) aa.print(x)
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
//GetFileNamesTrackingID
//GetConfirmationDocument
function callPDFService(serviceName, fileName, trackingIDsForWebService) {

    try {
        //var apiURL = "https://accelauspsservicetest.cityofws.org/api/PDFRetrieve/GetFileNamesTrackingID/toc011121.pdf/9171999991703876895663,9171999991703876895700,9171999991703876895793,9171999991703876895656"; //use lookup("ProjectDox_Configuration", "CreateProjectURL")66443410http://192.168.1.69/api/PDFRetrieve/
        //var apiURL = "https://accelauspsservicetest.cityofws.org/api/PDFRetrieve/GetFileNamesTrackingID/toc011121.pdf/9171999991703934968445,9171999991703877016760,9171999991703876895656,9171999991703876895663";
        //var apiURL = "https://accelauspsservicetest.cityofws.org/api/PDFRetrieve/GetFileNamesTrackingID/toc011121.pdf/9171999991703934968445,9171999991703877016760,9171999991703876895656,9171999991703876895663";
        //var apiURL = "https://accelauspsservicetest.cityofws.org/api/PDFRetrieve/"; 
        var apiURL = lookup("WINSALEM_SETTINGS_USPS", "PDF_SERVICE_URL");
        apiURL = apiURL + serviceName + "/" + fileName + "/" + trackingIDsForWebService;
        var headers = aa.util.newHashMap();
        headers.put("Content-Type", "application/json");
        //headers.put("Authorization", "Basic Y293c2NiZDpDaXR5b2ZXaW5zdG9uIzE =")
        logDebug("Calling to create project with URL: " + apiURL)
        var result = aa.httpClient.get(apiURL, headers);
        logDebug("result " + result.getSuccess())
        if (result.getSuccess()) {
            result = result.getOutput();
            logDebug("result " + result)
            return result;
        } else {
            //aa.sendMail(lookup("ProjectDox_Configuration", "ErrorFromEmail"), lookup("ProjectDox_Configuration", "ErrorRecipientEmail"), "", "Error in ProjectDox", "Error creating project in ProjectDox: " + result.getErrorMessage() + ". Cannot create project for record: " + capIDString)
            logDebug("Error creating project in ProjectDox: " + result.getErrorMessage());
            return null;
        }
    }
    catch (ex) {
        logDebug(ex.message)
    }
}

function getCapsFromDB() {
    var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
    var ds = initialContext.lookup("java:/WINSALEM");
    var conn = ds.getConnection();
    //Unable to get managed connection for java:/AA
    //conn.close()
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
            thisCap.TrackingID = results.getString("tracking");
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


//var trackingNumber = "(9171999991703877016760,9171999991703877306533)"
//var trackingFromService = '<ArrayOfstring xmlns:i="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://schemas.microsoft.com/2003/10/Serialization/Arrays">\
//    <string>9171999991703877016760</string>\
//<string>9171999991703877306076</string>\
//<string>9171999991703877306533</string>\
//<string>9171999991703877306700</string>\
//<string>9171999991703877308841</string>\
//<string>9171999991703877309015</string>\
//<string>9171999991703877309022</string>\
//<string>9171999991703877309039</string>\
//<string>9171999991703877309046</string>\
//<string>9171999991703877309190</string>\
//<string>9171999991703934965260</string>\
//<string>9171999991703934986531</string>\
//<string>9171999991703934986562</string>\
//<string>9171999991703934986579</string>\
//<string>9171999991703934986593</string>\
//<string>9171999991703934986609</string>\
//</ArrayOfstring >'
////aa.print(trackingFromService.toString())

//var capArray = new Array();



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

//for (x in capArray) {
//    aa.print(capArray[x].B1_PER_ID1);
//	var capId = aa.cap.getCapID(capArray[x].B1_PER_ID1, capArray[x].B1_PER_ID2, capArray[x].B1_PER_ID3).getOutput();
//	var USPSTable = loadASITable("USPS TRACKING", capId);

//	for (var x in USPSTable) {

//		USPSTable[x]["Signature Document"] = "https://winsalem-supp-av.accela.com/portlets/document/adobeDoc.do?mode=download&documentID=24744178&fileKey=A01000000283191E5C3H4W0YE2WE62&source=ADS&edmsType=ADS&haveDownloadRight=yes&refFrom=document&entityID=REC20-00000-003LT&altID=DEM-20-00004&entityType=CAP&module=Enforcement&fileName=7199+9991+7038+7701+6760.pdf";
//	}
//	removeASITable("USPS TRACKING", capId);
//	addASITable("USPS TRACKING", USPSTable, capId);

//}
//var capId = aa.cap.getCapID("VEH-21-00001").getOutput();
//var USPSTable = loadASITable("USPS TRACKING", capId);

//for (var x in USPSTable) {

//	USPSTable[x]["Signature Document"] = "https://winsalem-test-av.accela.com/portlets/document/adobeDoc.do?mode=download&documentID=24820828&fileKey=A01000000232541WM8J9RJNCNZKJM4&source=ADS&edmsType=ADS&haveDownloadRight=yes&refFrom=document&entityID=REC21-00000-00023&altID=VEH-21-00001&entityType=CAP&module=Enforcement&fileName=7199+9991+7038+7689+5663.pdf";
//}
//removeASITable("USPS TRACKING", capId);
//addASITable("USPS TRACKING", USPSTable, capId);

//var capId = aa.cap.getCapID("VST-20-00015").getOutput();
//var USPSTable = loadASITable("USPS TRACKING", capId);

//for (var x in USPSTable) {

//	USPSTable[x]["Signature Document"] = "https://winsalem-test-av.accela.com/portlets/document/adobeDoc.do?mode=download&documentID=24820849&fileKey=A01000000232542OZEH9YJBPPJXKXS&source=ADS&edmsType=ADS&haveDownloadRight=yes&refFrom=document&entityID=REC20-00000-003IG&altID=VST-20-00015&entityType=CAP&module=Enforcement&fileName=7199+9991+7038+7689+5700.pdf";
//}
//removeASITable("USPS TRACKING", capId);
//addASITable("USPS TRACKING", USPSTable, capId);

//var capId = aa.cap.getCapID("GRF-20-00029").getOutput();
//var USPSTable = loadASITable("USPS TRACKING", capId);

//for (var x in USPSTable) {

//	USPSTable[x]["Signature Document"] = "https://winsalem-test-av.accela.com/portlets/document/adobeDoc.do?mode=download&documentID=24820850&fileKey=A01000000232530MEQGHP2CHFLO4QD&source=ADS&edmsType=ADS&haveDownloadRight=yes&refFrom=document&entityID=REC20-00000-003ES&altID=GRF-20-00029&entityType=CAP&module=Enforcement&fileName=7199+9991+7038+7689+5793.pdf";
//}
//removeASITable("USPS TRACKING", capId);
//addASITable("USPS TRACKING", USPSTable, capId);

//var capId = aa.cap.getCapID("2020120296").getOutput();
//var USPSTable = loadASITable("USPS TRACKING", capId);

//for (var x in USPSTable) {

//	USPSTable[x]["Signature Document"] = "https://winsalem-test-av.accela.com/portlets/document/adobeDoc.do?mode=download&documentID=24820851&fileKey=A01000000232545OSGNLKNIJVSTODH&source=ADS&edmsType=ADS&haveDownloadRight=yes&refFrom=document&entityID=20HWS-00000-0001N&altID=2020120296&entityType=CAP&module=Enforcement&fileName=7199+9991+7038+7689+5847.pdf";
//}
//removeASITable("USPS TRACKING", capId);
//addASITable("USPS TRACKING", USPSTable, capId);
//REC20-00000-003DP
//var capIDs = aa.cap.getCapIDsByAppSpecificInfoField("Tracking Number", "9171999991703877016760").getOutput();
//var capIDs = aa.cap.getCapIDsByAppSpecificInfoField("Tow Company Name", "test").getOutput();
//aa.print(capIDs[0].ID1 + "-" + capIDs[0].ID2 + "-" + capIDs[0].ID3)
//for (x in capIDs[0]) aa.print(x)

/* Tracking Number
 <ArrayOfstring xmlns:i="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
<string>9171999991703877016760</string>
<string>9171999991703877306076</string>
<string>9171999991703877306533</string>
<string>9171999991703877306700</string>
<string>9171999991703877308841</string>
<string>9171999991703877309015</string>
<string>9171999991703877309022</string>
<string>9171999991703877309039</string>
<string>9171999991703877309046</string>
<string>9171999991703877309190</string>
<string>9171999991703934965260</string>
<string>9171999991703934986531</string>
<string>9171999991703934986562</string>
<string>9171999991703934986579</string>
<string>9171999991703934986593</string>
<string>9171999991703934986609</string>
</ArrayOfstring>
*/
//try {
//    var doc = "JVBERi0xLjcNJcjIyMjIyMgNMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvVmVyc2lvbi8xLjcvUGFnZXMgMyAwIFIvT3V0bGluZXMgMiAwIFIvTWV0YWRhdGEgMTUgMCBSPj4NCmVuZG9iagoyIDAgb2JqCjw8L1R5cGUvT3V0bGluZXM + Pg0KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZS9QYWdlcy9LaWRzWzggMCBSXS9Db3VudCAxPj4NCmVuZG9iago0IDAgb2JqCjw8L0F1dGhvcigpL0NyZWF0aW9uRGF0ZShEOjIwMjEwMTAzMDczODQ3LTA4JzAwJykvTW9kRGF0ZShEOjIwMjEwMTAzMDczODQ3LTA4JzAwJykvUHJvZHVjZXIoQXNwb3NlLlBERiBmb3IgLk5FVCAyMC4xMikvU3ViamVjdCgpL1RpdGxlKCkvQ3JlYXRvcihBc3Bvc2UgTHRkLik + Pg0KZW5kb2JqCjYgMCBvYmoKPDwvRmlsdGVyL0ZsYXRlRGVjb2RlL0xlbmd0aCA4Pj5zdHJlYW0NCnicAwAAAAABDQplbmRzdHJlYW0NCmVuZG9iago3IDAgb2JqClsvUERGXQ0KZW5kb2JqCjggMCBvYmoKPDwvVHlwZS9QYWdlL1BhcmVudCAzIDAgUi9NZWRpYUJveFswIDAgNjEyIDc5Ml0vQ29udGVudHMgOSAwIFIvUmVzb3VyY2VzPDwvUHJvY1NldFsvUERGL1RleHQvSW1hZ2VCL0ltYWdlQy9JbWFnZUldL0ZvbnQ8PC9GMSAxMSAwIFI + Pi9YT2JqZWN0PDwvaW1nMiAxMiAwIFIvaW1nMSAxMyAwIFIvaW1nMCAxNCAwIFI + Pj4 + Pj4NCmVuZG9iago5IDAgb2JqCjw8L0ZpbHRlci9GbGF0ZURlY29kZS9MZW5ndGggNTUxPj5zdHJlYW0NCnic1VTbjtowEH3nK + apaiU2OAkQ4G0XWAlpubSEVn30xhNwm9hgO6z4lP5tx0GsdiltRaVWqqJE0fjMnDMnM9k1dtAJGfgr6gUsgg6DhO6shJYs1wxGGt4TKOoeQb0YIsYI1Qk6J1B4Doq7Qdiuce04CfrxCRgdgQRt3KUNz9SOIBUNBjdh7F9a9yGEFMobb + Fd + qXhi708 / 1vRmjeseUfcISyMFlWGYkDRVsxaEYuYz7uKaThJP8P8Hj5NZst0PoPl7cN4CsP5dLqa + aM3cLdawmj8cfwwX0zHs3RwNUW6Qch1UegnqdYgLTgKCCzkHs0BpMq1KbmTWhHKwBCNk7lEAVMui28gHZagqvIRDSRhvw / 9fj + EhMU9SBIWQjfpsuAi77wyYDDTRlhiETLzprkNd / QgFXXhJ25PUoiRJJCVUVxbCQRkvQGLgQdlQBVee9SE2fAibZSELArAd20zrhTVlSVfI + i87pwkya1E5V61ToK2Ru + lIPgjklfB1T4v5VpxV5ma6cMzywB + Xum4Cxdm + ub55F9N929n / lYIg9b + l829aCPdcPUVDrqqp91igZnze + FHY6Gt4wUs0exlhjWAgAZK2gSPUYjCBgCTvC5gcFdJ + txcCOmHiFK5tZJqqAybF9VtC + QWIdPK8cwdqxc6o8wtcZO3uScm3jMpBrdkPjlO07rHP5lNkmSwODR / kbpStJMClkSC9kzBD2njlH7R3wEWK494DQplbmRzdHJlYW0NCmVuZG9iagoxMCAwIG9iagpbL1BERl0NCmVuZG9iagoxMSAwIG9iago8PC9TdWJ0eXBlL1R5cGUxL1R5cGUvRm9udC9CYXNlRm9udC9IZWx2ZXRpY2EvRW5jb2RpbmcvV2luQW5zaUVuY29kaW5nPj4NCmVuZG9iagoxMiAwIG9iago8PC9GaWx0ZXIvQ0NJVFRGYXhEZWNvZGUvTGVuZ3RoIDE3MTQvQ29sb3JTcGFjZS9EZXZpY2VHcmF5L1N1YnR5cGUvSW1hZ2UvSGVpZ2h0IDEyOS9UeXBlL1hPYmplY3QvRGVjb2RlUGFybXM8PC9Db2x1bW5zIDkyOC9Sb3dzIDEyOS9LIC0xPj4vV2lkdGggOTI4L0JpdHNQZXJDb21wb25lbnQgMT4 + c3RyZWFtDQowiPEfLojxfMIjxHjCI8R4wiPEeMIjjMIjxHjCI8R4wiPEeMIjxfMIjxHjCI8R4wiPEeMIjxHGXyPF8jxbnRFlERERERERERERERERERERERERERERERESbgqI5k0FJGeDJBtKdGAQjhnI4ZIME7IqjmVxJGaNEXjbMERwRoShHGXDJAwFZhxESDQ58DgzmRrxOJOGggRT / ET0XDJBg3Qi + 8RESODwQd2eRfNcURpiYxYiMdxKcMgFojnpvERERERIWhEs2wUiuwXO6BkAUUXTYsRISDDkEg3lVFhYKPOzDI4y4bRHA8NsYeETsRESEcg8ExM48EXHET4pE0ayLgfEcbTpM7iLIRGEECFpJEI + mhEoyOG0bFERYQgyuBj2Kx7QiIiHu68Suao3mAhfLingNAKLsTMNGIiIlApgDBcDQEKfxfEp0fR / LxhlwzmwwR2YAzDpUdcvvYiIiIiS6JAQ2zAHmXDJDOK3Uw / ERKmZczeGeGJvY68RETqj0dI0DQR2bDIDdWn8REjEbxKBCOIbA8NI6rNpK + hERIxl8xHgZy + NKEo8REGUQTHLHQ6QrYiJmIeZiEJIuJTo / 5ZsIRW840GmbvJTUbR9N8iO9PEgabQXg7oXan1i9BIurv + wuIoWEGhk1Scd5Zo1PO9fkY7fcvlDQQscRUNaFdJGH7H2qhDp7bCTs4 / 9tG9G8XkY98t8V9WCMPoPWmrRuG9nf79iKBg4j0 / 2TYkRkFeIXkEH / YmRP7NJdkY6f8KZrZhyI42oQvVWI0hG4aD3Zklil7O60M7kPEXFrMlgNjpk3NKmfqiF1tNs2hCBCEN8E3sOJ5Mhoe1hfETbpa1I2vLJTc4GFfTG7JsZI7HVjuOuogmIRCj3zIrDU7U18X96hHdEO48K6k3LUtCKMPdEGm1qLuUeD6IZm87YmNeW / QKwpNx0KhAlCvogo2RSEkiFT6X9BaRNiRCqcIEwb + F5lqiv2KDiu2WP0C1ESVRMrt4j0tImxkqOqjxRCj9AtRESPlRokgSx2XByaowzNEQji4TpUFM5o + kP4aZyLyBp6WkW4XiDbg6czk8faFoWhfC8RdPp5KBx3f2EswLvBoIFh / +pN1tCi / SBh2kSfF3pdcKCCdC / HwrQQrbBAmwj6Y / 7SJsJo79NpQWNsk + 9JcSOj2LmFQhlQew35Y / q0rE79D5n3Fv1 + mgi3VUJGJMh + Gf3yOynHvpHYF2SLEWlEXj5Uf + KtIt1hHYgxTOIwgg5DH6f + 0hO9UNRZgFzggX + juF2gibDELzj6mce36b9FuXQkHEpWrn0XGYvuQcf + 02kJBURtDkERH2DDFfEMjxcHpkz7qw02kI6FsFhN0PF2XBMdV29pE2WVwhtL98WThftOkTYGhElOwigQXRn4i4 / 94 / QQuna / dtImzshSJL4n0oREHE8NR3vuEW5Qsk0IveY5PE69q7qJG86YiblZQ7SD4LKj / 3QiISwxw + v2 / bSQMHBUO1 / dtIsgN3EjHxq3 + tMIEVZMdXvfbYSLJ / gvR6CHf7hIWiPKKCBHvt + 2pZBFF1B61b2HSLJUrBiU4OI9 / f905DYOTH7buKQuEJnDkEHKe + rf7EKJ3Q9kcP39E3W0zD2oIvginbXbYafJupoRDO9io6aXbHoadhPb7DeiyASH3 + Gw3om / JRxwdMk2eENovGpMOsXnHrlKVmEcFCERIO4MuzRMMq4aLIEQjQUEceVga2iCDiJCjhwwQPWjatDCEWhEh / LJQcNISGkEXWzfJSlvMJg01EEU6H8YsLmikMod5ZCvHCuDgioKgP7Y1MjCJtG40OSpIMYuxdTsFZzIbI4pgFyKxHirRXF0FGuw0inBEfbdTvRmjPA4QZgkIkMschRzOJBcc1hnA5czBGEaZdFzLimzOhm4gSK1iJHRfEKIjO5D2Z42HCR3PTLg0xEREREREREWEIkMDmcvgy7MIwMwjmbZfRF4vi7IxzaB + yoM6EMscscgeGgftKTNF3FxEREREREREREN8RERDQMpBcyCuPa3yWoKGIscREM / GHJjkHgtwhFoNJYhkY7BGiIiIiJNAzkcRISBpkMgQdEZwnLeEXCBlQFXF44nsRo7QdjigkCwRx9CUAaDINe0diaOR8QzjApHiOBmDia9sjhMRETRCzcazanciQYczl4RuQo8jSFehERERERNMhAznsvl2YRhGAyAZYP6EREREl8kEXyGKYI3FyOEYA8OSEUdsaiIkYmCERM0XjcQxTMKYDGrvQiIiIsqAhNoWg + IiPSqWU6NF9i6Q + oAIAIDQplbmRzdHJlYW0NCmVuZG9iagoxMyAwIG9iago8PC9GaWx0ZXIvQ0NJVFRGYXhEZWNvZGUvTGVuZ3RoIDMwNDkvQ29sb3JTcGFjZS9EZXZpY2VHcmF5L1N1YnR5cGUvSW1hZ2UvSGVpZ2h0IDMwNC9UeXBlL1hPYmplY3QvRGVjb2RlUGFybXM8PC9Db2x1bW5zIDkyOC9Sb3dzIDMwNC9LIC0xPj4vV2lkdGggOTI4L0JpdHNQZXJDb21wb25lbnQgMT4 + c3RyZWFtDQowiPEfLojxfMIjxfMIjxHjCI8R4wiOMwiPEeMIjxHjCI8XzCI8XzCI8R4wiPEeMIjxHjCI8Rxl8jxfI9ERERERERERERERERERERERERERERERIKoybk0VQiQzsKMjsjgeBIbRXcZNQWC7IllwIGF2CsSQ5pLOnJOfrsYsuIYuQJBV7Ig5olKjITn2UgijiJBJGMKHsQhuz + Ni1IZAalnclsz6fJD + 0Gos7iJCwfarolYsqBprkn2JGGbDIBpN5f5BUCltd2qYgzQIsuzC5DVLShH9uzkmJQGQGoR2YF6G6T787hWZEkZxHDIBsI8fSyC / lDm2eP5R3aaiLK1IMOccQaZsj / wQidxP9mwnqmJSQgxEWR7ljyMytDX3CfnF5LWZ4kYCEdkcZcMiI7NWsVRNOzC6j1hnVHGafdpiINMSC9jo9C2I92vZ7CFhTSXXE0GXDIDZhOvu7tC7vskM1K7EzDIDEZ4zCPIfv7XtbMAid5IjWyuiPBkdkcHCI5Gqv + Lu / Cn5NbCDM2ExNQHgUREP7 / 44tO9TcmhZXEhTYyOB4NMgcChe0 + 39vakCB2u3hC7EQyn2RxmGcZHs9 / HyHHHdXdqhdizubioxEREZHtsEU5NyC8enq49i1ERM8jgeG8SENNC0H6d / jkV + JQRHBXkDwJEr1TTdSC73 / ixBmH3uLvu7VfyIPamcnZMeGe2rtbtNbq + 1IZo8XEQ4k4OYA8C + wmWHa6euQYde + LPEQwzixERadr2nd6cQdngIcWTD8iOmpEHX + 4mcYA92Gh8NNOLtO6iQwWVHxZJ0 / 1qD + kGELTuyGIu7IUeY87zqWVrdkWAg / tEMGmlOzVAinmiNowfQuLjteRiMBzyHK0ghFFwqaISRXxDKqCadoRFJNCIhl80SSiIr8SY5FHcMwrPr1qkFHFjekTdUT3hwx2a1qL7QYNhggiPj3khedu5DUHf + qfizve201Trc1ojhC6lHKkM0Tcq1Jqd + IiIjhRC2v6k3qT3D1VReL6pTIsyuZJ4ZmjbI + YvSoKYzkZ5GIXtOIkIR9TK0RmcRvCEREM4R0Rklr7T1qs6IMqYiLLxHiPCv3 + wrGDCIsCIs3vcfVKLDuJFswZ5BOv7hiIkWCF8uX7tV6Mi7CJuYcRIRyPax9 + qFAmj4ZAGC + veu4jEi4XxnPsHtf6BmgWRw5HiP / f6Qgy / ERZxceq4xIUy9dKV68vGAyA23kGx / 6iLNhMcijmHD / dehERJwyBeQIHv6qW4aNAPBTWQr2u6wghOhFwwYA8NC / bWnpDPZ9H7skOnSpcRKsDydlYE7EkPf9SbaonA3cRFoatfEMlEqnka2FX4hkR4uLT + pNgRGgF1a6ihOiMZeI5464i0K + kJC0 / 5N1CE0vVIYf + DH9Tj1XH + ibqS9LQf6Vb + L / +qRN1NHtT2vUNBBQn1hwghnHrrTD + /ptj6WibqFCI+CKirrwxFPTvSF/XybrCHXS2dR / pv9aH / ybDF1 / nZTrXpDRqX1Ig / EetBdE3F / 7 / F / VVLJrfpVRZKddfqTYyQ0F9J6E7zFYVaSv / 9D / Wv2uk9cLUsnX7 / r9JKCKuCKf / 1qfSb / Xk2A14UfqqUcR / heTYwh7ztBak2GYnZK / 3SrMI7FESGv7 / 52nQntBBHv3gjjr3HVoL / aEKsTiOzwpfvequNlOq7 / 0uibAbJKnZVrH76rfNp / H / Szt0QtGawin6ZtDiP + knDTxEqeIiK2vqEGm0JWbdr00Pc4u1f87JPJsBM7UJxd70rtB / j / 6qgdEqQbK2r3r / 9N81b9va / 6kHCJPUO + tJkhb9qTYYg4m0Re / XIFEhJX9KmTCK4THE0TG / enqE19U087A1iD2oN1YXXb / C2bjupYkq93bV71phKuCbDQIxCJLUYQu9t97S / pXuOd0jGRCEd6YdN9dBha9 + o + 1sPddPHSVzIKQ2JjHHirSSWtLvJWg4nEu7HXS + oiJtEusrK / qutLCjkKuzC9 / 6wu5xCOStMQZHCU / r6S2EyuOiC4S / 3d3 + l1Gq2d / b / rheLK4NZ / KvKdYjH / brpUaljgm42ShH8PlaXrra0IcQ0In1Yv31 + teV / YlZVib3 + 9v9LqjohSIjOY / bqoW / vETaINFCIKgkok + pNc3Kv7r16iyi339rhbM1X3paTiLhP6TM1fr7qn0pXJ4ikZ4v4k + Xz6W001VqRR3d + V0 / zOswvWO + v / V79dSYyhEsyHJCCKHXxmETpKlVNU197SXHCDMYkUWaLHceSf2o933vV3ekqiJjcREVcemFaxa + rp6VXBYnEVHhsf1RFHrt1368EKmpDiLCMWvhNa2 / r8Rx6OqXbh / ++liaeP0FDp / 8lDqthMHuOF07rbV38SBrfpXX + 8O06iJ2ddaVnwaNr8P0pblV / WxTQ7SQMIjpqsrgSJXiKvVPW1Yi06Id6knuRRfSCqnZUp / SxsSPiQr6enfEmUQ1wqXoROJX6kM0cqAVNEyRxhbTDOBpLElCH + mELCaaIJmfDijQZxGFvdNlclQh / 2E0GmlMLuGEh1F1yuF + akTNGL3poRHFIundQXHsyEIiFaa4 / 7ILy14xBEefrIXkZEeMxCIzxEdkhKm7iTCFfSYQiwSmK0u0yQGkcFCEREMziOHeGP9MiyKBG5z3bJQEBCIiGeGaI + ZstMlqzF9DMORjkJaDipSlVkTBzchERIOcX99hIQYJnRGtps / xEhkApOyjEp0al5A1fiI0LT3IbBxIMDngMwZvPxhCLpp9rtW0yC4 + IiJKNqq09UIcTooLbQkVzbNbDvv3shixEQyp / DC + cFcGhKfRKAyJq + zjXYYWhEZx / uEUOLXilEGRYKgk8RI + vYIq3sh24FERIgiOGTXxgn / iaAuYDIBtdY / YPEMnBCDkh2Ui332RW4GhDKOEQmRwII4HhqCII77 / xETWm3 / w1iS8YA8OSrH / DSiThSOCz9vjiQwZf + 6JvXF8wCgf9RFncJbX6ZXGNP + IiZrnckPfofeQcfqdjWv7T9J / Tsjm / pcdhP9UrQu12pN0qcXG13x1SJuFIfUJ50XQS / IhfqQ0I / aSicMfVQmTcwv8IMSFL1s0AgX0nQZN6 / +G3QXWiOgioOPEp0tUx9A3va2IhvMT6WHEfVwbcuz6qoT9p6wnWGmSL6bwih9mGF6YJ1iLQvSasm5UuQg4 + vCf3pNYv + pkKW5N6ft9GQ1J3Zb1L5x / qCOOL1EEVEnXX6S2 + IiCKfu / x3j / ele5bkqO7Xu + rtqI//UzvybBSxqtLXomxdCR1u/mRdNbeI/6RGkSaEfybJUQJbyx10nDO0i3UmwxY9bWt2n3ip/NvENSQvrtB/QmNc8sWvu59F1tA4u3peUvdpvSEwhOLH9sl0ny9ifX/Sb07GFpE2W0IifX12gzOxvziyPhddu07dRxv6v7yJfQm0cQ+l3fadow6IfputJ2365qPcJj+vffbhCxBNoiF/f7p2moj+nd2eWErUFKzf9vhX/TT9bXf0m47+k1rXS8iHf17tp/5or/1T480p3CvT7Js6/T6ddCtqHflSXf/9pbIZbpNcfW4X/pYcbszmxW+vtetkNFXh7/Vev5rBLe3dTNWk7Vra7Xd/rZ0yOIXBj9fd/t9WzqjHxH1ar09df68gvO2mmv7Tur7iYQsNtfQr/v/zELV/p/t13XwyhHkN/emn/1+I2/1+27+69Yfdr+99doQ1X+++tpdM+FBkJOycIZY/++9PcRFprd/uG/r1VNYadhkoyHPZtX9nZYvaERZD3+wlsdep2nRc4M5dho7qTCaDoIj7Xb3uQRGEamYMEJBLO4sj5pl0UMga8RENaQi7Yaa8JogjiIiJEHEhB58zRhMjxfI4y4viJMISIVBx3eOIsjgzmZkczF0J5C0RInaolIa5cMgG0xG0YI3lCId4iPtSCgdxFoSI5Fcsd+Gg01vEaEgQacRFkUcRH5ZR3Jjh9hpDfGeChzQTf4iIkhHwwYIwGSD+IiGQynfloB5UIwGWRwyC8RNSM4ho2IRxDYHg15iM2fLERKEIZ8PBCT8GRwiIUCiIiU+eBW0L8SEDKXTPWPdr6He6qve+ACACDQplbmRzdHJlYW0NCmVuZG9iagoxNCAwIG9iago8PC9GaWx0ZXIvRmxhdGVEZWNvZGUvTGVuZ3RoIDk5OTAvQ29sb3JTcGFjZVsvSW5kZXhlZC9EZXZpY2VSR0IgMjU1KFwwMDBcMDAwXDAwMFwwMDBcMDAwM1wwMDBcMDAwZlwwMDBcMDAwXDIzMVwwMDBcMDAwXDMxNFwwMDBcMDAwXDM3N1wwMDArXDAwMFwwMDArM1wwMDArZlwwMDArXDIzMVwwMDArXDMxNFwwMDArXDM3N1wwMDBVXDAwMFwwMDBVM1wwMDBVZlwwMDBVXDIzMVwwMDBVXDMxNFwwMDBVXDM3N1wwMDBcMjAwXDAwMFwwMDBcMjAwM1wwMDBcMjAwZlwwMDBcMjAwXDIzMVwwMDBcMjAwXDMxNFwwMDBcMjAwXDM3N1wwMDBcMjUyXDAwMFwwMDBcMjUyM1wwMDBcMjUyZlwwMDBcMjUyXDIzMVwwMDBcMjUyXDMxNFwwMDBcMjUyXDM3N1wwMDBcMzI1XDAwMFwwMDBcMzI1M1wwMDBcMzI1ZlwwMDBcMzI1XDIzMVwwMDBcMzI1XDMxNFwwMDBcMzI1XDM3N1wwMDBcMzc3XDAwMFwwMDBcMzc3M1wwMDBcMzc3ZlwwMDBcMzc3XDIzMVwwMDBcMzc3XDMxNFwwMDBcMzc3XDM3NzNcMDAwXDAwMDNcMDAwMzNcMDAwZjNcMDAwXDIzMTNcMDAwXDMxNDNcMDAwXDM3NzMrXDAwMDMrMzMrZjMrXDIzMTMrXDMxNDMrXDM3NzNVXDAwMDNVMzNVZjNVXDIzMTNVXDMxNDNVXDM3NzNcMjAwXDAwMDNcMjAwMzNcMjAwZjNcMjAwXDIzMTNcMjAwXDMxNDNcMjAwXDM3NzNcMjUyXDAwMDNcMjUyMzNcMjUyZjNcMjUyXDIzMTNcMjUyXDMxNDNcMjUyXDM3NzNcMzI1XDAwMDNcMzI1MzNcMzI1ZjNcMzI1XDIzMTNcMzI1XDMxNDNcMzI1XDM3NzNcMzc3XDAwMDNcMzc3MzNcMzc3ZjNcMzc3XDIzMTNcMzc3XDMxNDNcMzc3XDM3N2ZcMDAwXDAwMGZcMDAwM2ZcMDAwZmZcMDAwXDIzMWZcMDAwXDMxNGZcMDAwXDM3N2YrXDAwMGYrM2YrZmYrXDIzMWYrXDMxNGYrXDM3N2ZVXDAwMGZVM2ZVZmZVXDIzMWZVXDMxNGZVXDM3N2ZcMjAwXDAwMGZcMjAwM2ZcMjAwZmZcMjAwXDIzMWZcMjAwXDMxNGZcMjAwXDM3N2ZcMjUyXDAwMGZcMjUyM2ZcMjUyZmZcMjUyXDIzMWZcMjUyXDMxNGZcMjUyXDM3N2ZcMzI1XDAwMGZcMzI1M2ZcMzI1ZmZcMzI1XDIzMWZcMzI1XDMxNGZcMzI1XDM3N2ZcMzc3XDAwMGZcMzc3M2ZcMzc3ZmZcMzc3XDIzMWZcMzc3XDMxNGZcMzc3XDM3N1wyMzFcMDAwXDAwMFwyMzFcMDAwM1wyMzFcMDAwZlwyMzFcMDAwXDIzMVwyMzFcMDAwXDMxNFwyMzFcMDAwXDM3N1wyMzErXDAwMFwyMzErM1wyMzErZlwyMzErXDIzMVwyMzErXDMxNFwyMzErXDM3N1wyMzFVXDAwMFwyMzFVM1wyMzFVZlwyMzFVXDIzMVwyMzFVXDMxNFwyMzFVXDM3N1wyMzFcMjAwXDAwMFwyMzFcMjAwM1wyMzFcMjAwZlwyMzFcMjAwXDIzMVwyMzFcMjAwXDMxNFwyMzFcMjAwXDM3N1wyMzFcMjUyXDAwMFwyMzFcMjUyM1wyMzFcMjUyZlwyMzFcMjUyXDIzMVwyMzFcMjUyXDMxNFwyMzFcMjUyXDM3N1wyMzFcMzI1XDAwMFwyMzFcMzI1M1wyMzFcMzI1ZlwyMzFcMzI1XDIzMVwyMzFcMzI1XDMxNFwyMzFcMzI1XDM3N1wyMzFcMzc3XDAwMFwyMzFcMzc3M1wyMzFcMzc3ZlwyMzFcMzc3XDIzMVwyMzFcMzc3XDMxNFwyMzFcMzc3XDM3N1wzMTRcMDAwXDAwMFwzMTRcMDAwM1wzMTRcMDAwZlwzMTRcMDAwXDIzMVwzMTRcMDAwXDMxNFwzMTRcMDAwXDM3N1wzMTQrXDAwMFwzMTQrM1wzMTQrZlwzMTQrXDIzMVwzMTQrXDMxNFwzMTQrXDM3N1wzMTRVXDAwMFwzMTRVM1wzMTRVZlwzMTRVXDIzMVwzMTRVXDMxNFwzMTRVXDM3N1wzMTRcMjAwXDAwMFwzMTRcMjAwM1wzMTRcMjAwZlwzMTRcMjAwXDIzMVwzMTRcMjAwXDMxNFwzMTRcMjAwXDM3N1wzMTRcMjUyXDAwMFwzMTRcMjUyM1wzMTRcMjUyZlwzMTRcMjUyXDIzMVwzMTRcMjUyXDMxNFwzMTRcMjUyXDM3N1wzMTRcMzI1XDAwMFwzMTRcMzI1M1wzMTRcMzI1ZlwzMTRcMzI1XDIzMVwzMTRcMzI1XDMxNFwzMTRcMzI1XDM3N1wzMTRcMzc3XDAwMFwzMTRcMzc3M1wzMTRcMzc3ZlwzMTRcMzc3XDIzMVwzMTRcMzc3XDMxNFwzMTRcMzc3XDM3N1wzNzdcMDAwXDAwMFwzNzdcMDAwM1wzNzdcMDAwZlwzNzdcMDAwXDIzMVwzNzdcMDAwXDMxNFwzNzdcMDAwXDM3N1wzNzcrXDAwMFwzNzcrM1wzNzcrZlwzNzcrXDIzMVwzNzcrXD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dgW4vyGdcbrurUDcx0ICIpghgIEXxJbQrM5VGW80UNYqVoVY2HyAPVkiilrSfhoJswmtEnVap//hxrqpHPz2LFtMkWo+bksreKb9Ddh3mkeTlJlnxb8yiJBIjEb/hEXKbS6lbln91mfrv5GW4OAABwFMxK8ZwxM/BVPmtcG5lhwBsdvGBXtqsaBYeid4jYC9IezzJV/X6IPFAdm9jzP7s8voAwD5+2Q9dAd6ZpM6oaTPgENGKTDZrq/v36zP9NrYhXqZ9KIKKtUel3oeeGr/lAdNo81pvKNWJx+8MttrYAAICjIBNhmNvl0C8tCKODkOuh74N2iE2sRD0akMl+d6qGOfiEPTA5a01CCc+7yJPydK31EbgG7vgJw85RFZtuDsJVMVJ3Spb/zeacjcH9jmXGlr4cTHPQnA1kD2TQunZQBM3GKhXVn/Xl5u38FjYHAAA4CpYsdmG7nGWz8qUf0YIvd9jbXRV/qSIIqiN5vsWcybLJPNw1ezIVx3wR9c1zlTo3h3l3pt2/QbT1F/+9qrD+IejMH0JS7uSoyk43PCXTOt5YdbRbarvfcuKuptSR5lNXpD3430x5D4zLco5cI+gaKczBtsMrajeHcvIFbA4AAAAeiWKzXtTHBs76X4ldc8MXm11xl3u+qBSIAkGZAAAAAEjhplT3uuxRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMD9+X88HmLKDQplbmRzdHJlYW0NCmVuZG9iagoxNSAwIG9iago8PC9MZW5ndGggMjM3L1R5cGUvTWV0YWRhdGEvU3VidHlwZS9YTUw+PnN0cmVhbQ0KPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyI+CiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIC8+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+DQplbmRzdHJlYW0NCmVuZG9iagp4cmVmCjAgNQ0KMDAwMDAwMDAwMCA2NTUzNSBmDQowMDAwMDAwMDE4IDAwMDAwIG4NCjAwMDAwMDAxMDcgMDAwMDAgbg0KMDAwMDAwMDE0MiAwMDAwMCBuDQowMDAwMDAwMTk0IDAwMDAwIG4NCjYgMTANCjAwMDAwMDAzNzAgMDAwMDAgbg0KMDAwMDAwMDQ0NiAwMDAwMCBuDQowMDAwMDAwNDY5IDAwMDAwIG4NCjAwMDAwMDA2NzEgMDAwMDAgbg0KMDAwMDAwMTI5MiAwMDAwMCBuDQowMDAwMDAxMzE2IDAwMDAwIG4NCjAwMDAwMDE0MDYgMDAwMDAgbg0KMDAwMDAwMzMyNiAwMDAwMCBuDQowMDAwMDA2NTgxIDAwMDAwIG4NCjAwMDAwMTkxMDAgMDAwMDAgbg0KdHJhaWxlcgo8PC9Sb290IDEgMCBSL0luZm8gNCAwIFIvSURbPDM0NDYyRDM5MzcyRDM4NDQyRDMwMzEyRDM2NDYyRDM1PjwzNDQ2MkQzOTM3MkQzODQ0MkQzMDMxMkQzNjQ2MkQzNT5dL1NpemUgMTY+PgpzdGFydHhyZWYKMTk0MTUKJSVFT0YK"
//    var returnedXML = '<base64Binary xmlns = "http://schemas.microsoft.com/2003/10/Serialization/" > JVBERi0xLjcNJcjIyMjIyMgNMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvVmVyc2lvbi8xLjcvUGFnZXMgMyAwIFIvT3V0bGluZXMgMiAwIFIvTWV0YWRhdGEgMTUgMCBSPj4NCmVuZG9iagoyIDAgb2JqCjw8L1R5cGUvT3V0bGluZXM + Pg0KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZS9QYWdlcy9LaWRzWzggMCBSXS9Db3VudCAxPj4NCmVuZG9iago0IDAgb2JqCjw8L0F1dGhvcigpL0NyZWF0aW9uRGF0ZShEOjIwMjEwMTAzMDgxMDU3LTA4JzAwJykvTW9kRGF0ZShEOjIwMjEwMTAzMDgxMDU3LTA4JzAwJykvUHJvZHVjZXIoQXNwb3NlLlBERiBmb3IgLk5FVCAyMC4xMikvU3ViamVjdCgpL1RpdGxlKCkvQ3JlYXRvcihBc3Bvc2UgTHRkLik + Pg0KZW5kb2JqCjYgMCBvYmoKPDwvRmlsdGVyL0ZsYXRlRGVjb2RlL0xlbmd0aCA4Pj5zdHJlYW0NCnicAwAAAAABDQplbmRzdHJlYW0NCmVuZG9iago3IDAgb2JqClsvUERGXQ0KZW5kb2JqCjggMCBvYmoKPDwvVHlwZS9QYWdlL1BhcmVudCAzIDAgUi9NZWRpYUJveFswIDAgNjEyIDc5Ml0vQ29udGVudHMgOSAwIFIvUmVzb3VyY2VzPDwvUHJvY1NldFsvUERGL1RleHQvSW1hZ2VCL0ltYWdlQy9JbWFnZUldL0ZvbnQ8PC9GMSAxMSAwIFI + Pi9YT2JqZWN0PDwvaW1nMiAxMiAwIFIvaW1nMSAxMyAwIFIvaW1nMCAxNCAwIFI + Pj4 + Pj4NCmVuZG9iago5IDAgb2JqCjw8L0ZpbHRlci9GbGF0ZURlY29kZS9MZW5ndGggNTUxPj5zdHJlYW0NCnic1VTbjtowEH3nK + apaiU2OAkQ4G0XWAlpubSEVn30xhNwm9hgO6z4lP5tx0GsdiltRaVWqqJE0fjMnDMnM9k1dtAJGfgr6gUsgg6DhO6shJYs1wxGGt4TKOoeQb0YIsYI1Qk6J1B4Doq7Qdiuce04CfrxCRgdgQRt3KUNz9SOIBUNBjdh7F9a9yGEFMobb + Fd + qXhi708 / 1vRmjeseUfcISyMFlWGYkDRVsxaEYuYz7uKaThJP8P8Hj5NZst0PoPl7cN4CsP5dLqa+aM3cLdawmj8cfwwX0zHs3RwNUW6Qch1UegnqdYgLTgKCCzkHs0BpMq1KbmTWhHKwBCNk7lEAVMui28gHZagqvIRDSRhvw / 9fj + EhMU9SBIWQjfpsuAi77wyYDDTRlhiETLzprkNd / QgFXXhJ25PUoiRJJCVUVxbCQRkvQGLgQdlQBVee9SE2fAibZSELArAd20zrhTVlSVfI + i87pwkya1E5V61ToK2Ru + lIPgjklfB1T4v5VpxV5ma6cMzywB + Xum4Cxdm + ub55F9N929n / lYIg9b + l829aCPdcPUVDrqqp91igZnze + FHY6Gt4wUs0exlhjWAgAZK2gSPUYjCBgCTvC5gcFdJ + txcCOmHiFK5tZJqqAybF9VtC + QWIdPK8cwdqxc6o8wtcZO3uScm3jMpBrdkPjlO07rHP5lNkmSwODR / kbpStJMClkSC9kzBD2njlH7R3wEWK494DQplbmRzdHJlYW0NCmVuZG9iagoxMCAwIG9iagpbL1BERl0NCmVuZG9iagoxMSAwIG9iago8PC9TdWJ0eXBlL1R5cGUxL1R5cGUvRm9udC9CYXNlRm9udC9IZWx2ZXRpY2EvRW5jb2RpbmcvV2luQW5zaUVuY29kaW5nPj4NCmVuZG9iagoxMiAwIG9iago8PC9GaWx0ZXIvQ0NJVFRGYXhEZWNvZGUvTGVuZ3RoIDE3MTQvQ29sb3JTcGFjZS9EZXZpY2VHcmF5L1N1YnR5cGUvSW1hZ2UvSGVpZ2h0IDEyOS9UeXBlL1hPYmplY3QvRGVjb2RlUGFybXM8PC9Db2x1bW5zIDkyOC9Sb3dzIDEyOS9LIC0xPj4vV2lkdGggOTI4L0JpdHNQZXJDb21wb25lbnQgMT4 + c3RyZWFtDQowiPEfLojxfMIjxHjCI8R4wiPEeMIjjMIjxHjCI8R4wiPEeMIjxfMIjxHjCI8R4wiPEeMIjxHGXyPF8jxbnRFlERERERERERERERERERERERERERERERESbgqI5k0FJGeDJBtKdGAQjhnI4ZIME7IqjmVxJGaNEXjbMERwRoShHGXDJAwFZhxESDQ58DgzmRrxOJOGggRT / ET0XDJBg3Qi + 8RESODwQd2eRfNcURpiYxYiMdxKcMgFojnpvERERERIWhEs2wUiuwXO6BkAUUXTYsRISDDkEg3lVFhYKPOzDI4y4bRHA8NsYeETsRESEcg8ExM48EXHET4pE0ayLgfEcbTpM7iLIRGEECFpJEI + mhEoyOG0bFERYQgyuBj2Kx7QiIiHu68Suao3mAhfLingNAKLsTMNGIiIlApgDBcDQEKfxfEp0fR / LxhlwzmwwR2YAzDpUdcvvYiIiIiS6JAQ2zAHmXDJDOK3Uw / ERKmZczeGeGJvY68RETqj0dI0DQR2bDIDdWn8REjEbxKBCOIbA8NI6rNpK + hERIxl8xHgZy + NKEo8REGUQTHLHQ6QrYiJmIeZiEJIuJTo / 5ZsIRW840GmbvJTUbR9N8iO9PEgabQXg7oXan1i9BIurv + wuIoWEGhk1Scd5Zo1PO9fkY7fcvlDQQscRUNaFdJGH7H2qhDp7bCTs4 / 9tG9G8XkY98t8V9WCMPoPWmrRuG9nf79iKBg4j0 / 2TYkRkFeIXkEH / YmRP7NJdkY6f8KZrZhyI42oQvVWI0hG4aD3Zklil7O60M7kPEXFrMlgNjpk3NKmfqiF1tNs2hCBCEN8E3sOJ5Mhoe1hfETbpa1I2vLJTc4GFfTG7JsZI7HVjuOuogmIRCj3zIrDU7U18X96hHdEO48K6k3LUtCKMPdEGm1qLuUeD6IZm87YmNeW / QKwpNx0KhAlCvogo2RSEkiFT6X9BaRNiRCqcIEwb + F5lqiv2KDiu2WP0C1ESVRMrt4j0tImxkqOqjxRCj9AtRESPlRokgSx2XByaowzNEQji4TpUFM5o + kP4aZyLyBp6WkW4XiDbg6czk8faFoWhfC8RdPp5KBx3f2EswLvBoIFh / +pN1tCi / SBh2kSfF3pdcKCCdC / HwrQQrbBAmwj6Y / 7SJsJo79NpQWNsk + 9JcSOj2LmFQhlQew35Y / q0rE79D5n3Fv1 + mgi3VUJGJMh + Gf3yOynHvpHYF2SLEWlEXj5Uf + KtIt1hHYgxTOIwgg5DH6f + 0hO9UNRZgFzggX + juF2gibDELzj6mce36b9FuXQkHEpWrn0XGYvuQcf + 02kJBURtDkERH2DDFfEMjxcHpkz7qw02kI6FsFhN0PF2XBMdV29pE2WVwhtL98WThftOkTYGhElOwigQXRn4i4 / 94 / QQuna / dtImzshSJL4n0oREHE8NR3vuEW5Qsk0IveY5PE69q7qJG86YiblZQ7SD4LKj / 3QiISwxw + v2 / bSQMHBUO1 / dtIsgN3EjHxq3 + tMIEVZMdXvfbYSLJ / gvR6CHf7hIWiPKKCBHvt + 2pZBFF1B61b2HSLJUrBiU4OI9 / f905DYOTH7buKQuEJnDkEHKe + rf7EKJ3Q9kcP39E3W0zD2oIvginbXbYafJupoRDO9io6aXbHoadhPb7DeiyASH3 + Gw3om / JRxwdMk2eENovGpMOsXnHrlKVmEcFCERIO4MuzRMMq4aLIEQjQUEceVga2iCDiJCjhwwQPWjatDCEWhEh / LJQcNISGkEXWzfJSlvMJg01EEU6H8YsLmikMod5ZCvHCuDgioKgP7Y1MjCJtG40OSpIMYuxdTsFZzIbI4pgFyKxHirRXF0FGuw0inBEfbdTvRmjPA4QZgkIkMschRzOJBcc1hnA5czBGEaZdFzLimzOhm4gSK1iJHRfEKIjO5D2Z42HCR3PTLg0xEREREREREWEIkMDmcvgy7MIwMwjmbZfRF4vi7IxzaB + yoM6EMscscgeGgftKTNF3FxEREREREREREN8RERDQMpBcyCuPa3yWoKGIscREM / GHJjkHgtwhFoNJYhkY7BGiIiIiJNAzkcRISBpkMgQdEZwnLeEXCBlQFXF44nsRo7QdjigkCwRx9CUAaDINe0diaOR8QzjApHiOBmDia9sjhMRETRCzcazanciQYczl4RuQo8jSFehERERERNMhAznsvl2YRhGAyAZYP6EREREl8kEXyGKYI3FyOEYA8OSEUdsaiIkYmCERM0XjcQxTMKYDGrvQiIiIsqAhNoWg + IiPSqWU6NF9i6Q + oAIAIDQplbmRzdHJlYW0NCmVuZG9iagoxMyAwIG9iago8PC9GaWx0ZXIvQ0NJVFRGYXhEZWNvZGUvTGVuZ3RoIDMwNDkvQ29sb3JTcGFjZS9EZXZpY2VHcmF5L1N1YnR5cGUvSW1hZ2UvSGVpZ2h0IDMwNC9UeXBlL1hPYmplY3QvRGVjb2RlUGFybXM8PC9Db2x1bW5zIDkyOC9Sb3dzIDMwNC9LIC0xPj4vV2lkdGggOTI4L0JpdHNQZXJDb21wb25lbnQgMT4 + c3RyZWFtDQowiPEfLojxfMIjxfMIjxHjCI8R4wiOMwiPEeMIjxHjCI8XzCI8XzCI8R4wiPEeMIjxHjCI8Rxl8jxfI9ERERERERERERERERERERERERERERERIKoybk0VQiQzsKMjsjgeBIbRXcZNQWC7IllwIGF2CsSQ5pLOnJOfrsYsuIYuQJBV7Ig5olKjITn2UgijiJBJGMKHsQhuz + Ni1IZAalnclsz6fJD + 0Gos7iJCwfarolYsqBprkn2JGGbDIBpN5f5BUCltd2qYgzQIsuzC5DVLShH9uzkmJQGQGoR2YF6G6T787hWZEkZxHDIBsI8fSyC / lDm2eP5R3aaiLK1IMOccQaZsj / wQidxP9mwnqmJSQgxEWR7ljyMytDX3CfnF5LWZ4kYCEdkcZcMiI7NWsVRNOzC6j1hnVHGafdpiINMSC9jo9C2I92vZ7CFhTSXXE0GXDIDZhOvu7tC7vskM1K7EzDIDEZ4zCPIfv7XtbMAid5IjWyuiPBkdkcHCI5Gqv + Lu / Cn5NbCDM2ExNQHgUREP7 / 44tO9TcmhZXEhTYyOB4NMgcChe0 + 39vakCB2u3hC7EQyn2RxmGcZHs9 / HyHHHdXdqhdizubioxEREZHtsEU5NyC8enq49i1ERM8jgeG8SENNC0H6d / jkV + JQRHBXkDwJEr1TTdSC73 / ixBmH3uLvu7VfyIPamcnZMeGe2rtbtNbq + 1IZo8XEQ4k4OYA8C + wmWHa6euQYde + LPEQwzixERadr2nd6cQdngIcWTD8iOmpEHX + 4mcYA92Gh8NNOLtO6iQwWVHxZJ0 / 1qD + kGELTuyGIu7IUeY87zqWVrdkWAg / tEMGmlOzVAinmiNowfQuLjteRiMBzyHK0ghFFwqaISRXxDKqCadoRFJNCIhl80SSiIr8SY5FHcMwrPr1qkFHFjekTdUT3hwx2a1qL7QYNhggiPj3khedu5DUHf + qfizve201Trc1ojhC6lHKkM0Tcq1Jqd + IiIjhRC2v6k3qT3D1VReL6pTIsyuZJ4ZmjbI + YvSoKYzkZ5GIXtOIkIR9TK0RmcRvCEREM4R0Rklr7T1qs6IMqYiLLxHiPCv3 + wrGDCIsCIs3vcfVKLDuJFswZ5BOv7hiIkWCF8uX7tV6Mi7CJuYcRIRyPax9 + qFAmj4ZAGC + veu4jEi4XxnPsHtf6BmgWRw5HiP / f6Qgy / ERZxceq4xIUy9dKV68vGAyA23kGx / 6iLNhMcijmHD / dehERJwyBeQIHv6qW4aNAPBTWQr2u6wghOhFwwYA8NC / bWnpDPZ9H7skOnSpcRKsDydlYE7EkPf9SbaonA3cRFoatfEMlEqnka2FX4hkR4uLT + pNgRGgF1a6ihOiMZeI5464i0K + kJC0 / 5N1CE0vVIYf + DH9Tj1XH + ibqS9LQf6Vb + L / +qRN1NHtT2vUNBBQn1hwghnHrrTD + /ptj6WibqFCI+CKirrwxFPTvSF/XybrCHXS2dR / pv9aH / ybDF1 / nZTrXpDRqX1Ig / EetBdE3F / 7 / F / VVLJrfpVRZKddfqTYyQ0F9J6E7zFYVaSv / 9D / Wv2uk9cLUsnX7 / r9JKCKuCKf / 1qfSb / Xk2A14UfqqUcR / heTYwh7ztBak2GYnZK / 3SrMI7FESGv7 / 52nQntBBHv3gjjr3HVoL / aEKsTiOzwpfvequNlOq7 / 0uibAbJKnZVrH76rfNp / H / Szt0QtGawin6ZtDiP + knDTxEqeIiK2vqEGm0JWbdr00Pc4u1f87JPJsBM7UJxd70rtB / j / 6qgdEqQbK2r3r / 9N81b9va / 6kHCJPUO + tJkhb9qTYYg4m0Re / XIFEhJX9KmTCK4THE0TG / enqE19U087A1iD2oN1YXXb / C2bjupYkq93bV71phKuCbDQIxCJLUYQu9t97S / pXuOd0jGRCEd6YdN9dBha9 + o + 1sPddPHSVzIKQ2JjHHirSSWtLvJWg4nEu7HXS + oiJtEusrK / qutLCjkKuzC9 / 6wu5xCOStMQZHCU / r6S2EyuOiC4S / 3d3 + l1Gq2d / b / rheLK4NZ / KvKdYjH / brpUaljgm42ShH8PlaXrra0IcQ0In1Yv31 + teV / YlZVib3 + 9v9LqjohSIjOY / bqoW / vETaINFCIKgkok + pNc3Kv7r16iyi339rhbM1X3paTiLhP6TM1fr7qn0pXJ4ikZ4v4k + Xz6W001VqRR3d + V0 / zOswvWO + v / V79dSYyhEsyHJCCKHXxmETpKlVNU197SXHCDMYkUWaLHceSf2o933vV3ekqiJjcREVcemFaxa + rp6VXBYnEVHhsf1RFHrt1368EKmpDiLCMWvhNa2 / r8Rx6OqXbh / ++liaeP0FDp / 8lDqthMHuOF07rbV38SBrfpXX + 8O06iJ2ddaVnwaNr8P0pblV / WxTQ7SQMIjpqsrgSJXiKvVPW1Yi06Id6knuRRfSCqnZUp / SxsSPiQr6enfEmUQ1wqXoROJX6kM0cqAVNEyRxhbTDOBpLElCH + mELCaaIJmfDijQZxGFvdNlclQh / 2E0GmlMLuGEh1F1yuF + akTNGL3poRHFIundQXHsyEIiFaa4 / 7ILy14xBEefrIXkZEeMxCIzxEdkhKm7iTCFfSYQiwSmK0u0yQGkcFCEREMziOHeGP9MiyKBG5z3bJQEBCIiGeGaI + ZstMlqzF9DMORjkJaDipSlVkTBzchERIOcX99hIQYJnRGtps / xEhkApOyjEp0al5A1fiI0LT3IbBxIMDngMwZvPxhCLpp9rtW0yC4 + IiJKNqq09UIcTooLbQkVzbNbDvv3shixEQyp / DC + cFcGhKfRKAyJq + zjXYYWhEZx / uEUOLXilEGRYKgk8RI + vYIq3sh24FERIgiOGTXxgn / iaAuYDIBtdY / YPEMnBCDkh2Ui332RW4GhDKOEQmRwII4HhqCII77 / xETWm3 / w1iS8YA8OSrH / DSiThSOCz9vjiQwZf + 6JvXF8wCgf9RFncJbX6ZXGNP + IiZrnckPfofeQcfqdjWv7T9J / Tsjm / pcdhP9UrQu12pN0qcXG13x1SJuFIfUJ50XQS / IhfqQ0I / aSicMfVQmTcwv8IMSFL1s0AgX0nQZN6 / +G3QXWiOgioOPEp0tUx9A3va2IhvMT6WHEfVwbcuz6qoT9p6wnWGmSL6bwih9mGF6YJ1iLQvSasm5UuQg4 + vCf3pNYv + pkKW5N6ft9GQ1J3Zb1L5x / qCOOL1EEVEnXX6S2 + IiCKfu / x3j / ele5bkqO7Xu + rtqI//UzvybBSxqtLXomxdCR1u/mRdNbeI/6RGkSaEfybJUQJbyx10nDO0i3UmwxY9bWt2n3ip/NvENSQvrtB/QmNc8sWvu59F1tA4u3peUvdpvSEwhOLH9sl0ny9ifX/Sb07GFpE2W0IifX12gzOxvziyPhddu07dRxv6v7yJfQm0cQ+l3fadow6IfputJ2365qPcJj+vffbhCxBNoiF/f7p2moj+nd2eWErUFKzf9vhX/TT9bXf0m47+k1rXS8iHf17tp/5or/1T480p3CvT7Js6/T6ddCtqHflSXf/9pbIZbpNcfW4X/pYcbszmxW+vtetkNFXh7/Vev5rBLe3dTNWk7Vra7Xd/rZ0yOIXBj9fd/t9WzqjHxH1ar09df68gvO2mmv7Tur7iYQsNtfQr/v/zELV/p/t13XwyhHkN/emn/1+I2/1+27+69Yfdr+99doQ1X+++tpdM+FBkJOycIZY/++9PcRFprd/uG/r1VNYadhkoyHPZtX9nZYvaERZD3+wlsdep2nRc4M5dho7qTCaDoIj7Xb3uQRGEamYMEJBLO4sj5pl0UMga8RENaQi7Yaa8JogjiIiJEHEhB58zRhMjxfI4y4viJMISIVBx3eOIsjgzmZkczF0J5C0RInaolIa5cMgG0xG0YI3lCId4iPtSCgdxFoSI5Fcsd+Gg01vEaEgQacRFkUcRH5ZR3Jjh9hpDfGeChzQTf4iIkhHwwYIwGSD+IiGQynfloB5UIwGWRwyC8RNSM4ho2IRxDYHg15iM2fLERKEIZ8PBCT8GRwiIUCiIiU+eBW0L8SEDKXTPWPdr6He6qve+ACACDQplbmRzdHJlYW0NCmVuZG9iagoxNCAwIG9iago8PC9GaWx0ZXIvRmxhdGVEZWNvZGUvTGVuZ3RoIDk5OTAvQ29sb3JTcGFjZVsvSW5kZXhlZC9EZXZpY2VSR0IgMjU1KFwwMDBcMDAwXDAwMFwwMDBcMDAwM1wwMDBcMDAwZlwwMDBcMDAwXDIzMVwwMDBcMDAwXDMxNFwwMDBcMDAwXDM3N1wwMDArXDAwMFwwMDArM1wwMDArZlwwMDArXDIzMVwwMDArXDMxNFwwMDArXDM3N1wwMDBVXDAwMFwwMDBVM1wwMDBVZlwwMDBVXDIzMVwwMDBVXDMxNFwwMDBVXDM3N1wwMDBcMjAwXDAwMFwwMDBcMjAwM1wwMDBcMjAwZlwwMDBcMjAwXDIzMVwwMDBcMjAwXDMxNFwwMDBcMjAwXDM3N1wwMDBcMjUyXDAwMFwwMDBcMjUyM1wwMDBcMjUyZlwwMDBcMjUyXDIzMVwwMDBcMjUyXDMxNFwwMDBcMjUyXDM3N1wwMDBcMzI1XDAwMFwwMDBcMzI1M1wwMDBcMzI1ZlwwMDBcMzI1XDIzMVwwMDBcMzI1XDMxNFwwMDBcMzI1XDM3N1wwMDBcMzc3XDAwMFwwMDBcMzc3M1wwMDBcMzc3ZlwwMDBcMzc3XDIzMVwwMDBcMzc3XDMxNFwwMDBcMzc3XDM3NzNcMDAwXDAwMDNcMDAwMzNcMDAwZjNcMDAwXDIzMTNcMDAwXDMxNDNcMDAwXDM3NzMrXDAwMDMrMzMrZjMrXDIzMTMrXDMxNDMrXDM3NzNVXDAwMDNVMzNVZjNVXDIzMTNVXDMxNDNVXDM3NzNcMjAwXDAwMDNcMjAwMzNcMjAwZjNcMjAwXDIzMTNcMjAwXDMxNDNcMjAwXDM3NzNcMjUyXDAwMDNcMjUyMzNcMjUyZjNcMjUyXDIzMTNcMjUyXDMxNDNcMjUyXDM3NzNcMzI1XDAwMDNcMzI1MzNcMzI1ZjNcMzI1XDIzMTNcMzI1XDMxNDNcMzI1XDM3NzNcMzc3XDAwMDNcMzc3MzNcMzc3ZjNcMzc3XDIzMTNcMzc3XDMxNDNcMzc3XDM3N2ZcMDAwXDAwMGZcMDAwM2ZcMDAwZmZcMDAwXDIzMWZcMDAwXDMxNGZcMDAwXDM3N2YrXDAwMGYrM2YrZmYrXDIzMWYrXDMxNGYrXDM3N2ZVXDAwMGZVM2ZVZmZVXDIzMWZVXDMxNGZVXDM3N2ZcMjAwXDAwMGZcMjAwM2ZcMjAwZmZcMjAwXDIzMWZcMjAwXDMxNGZcMjAwXDM3N2ZcMjUyXDAwMGZcMjUyM2ZcMjUyZmZcMjUyXDIzMWZcMjUyXDMxNGZcMjUyXDM3N2ZcMzI1XDAwMGZcMzI1M2ZcMzI1ZmZcMzI1XDIzMWZcMzI1XDMxNGZcMzI1XDM3N2ZcMzc3XDAwMGZcMzc3M2ZcMzc3ZmZcMzc3XDIzMWZcMzc3XDMxNGZcMzc3XDM3N1wyMzFcMDAwXDAwMFwyMzFcMDAwM1wyMzFcMDAwZlwyMzFcMDAwXDIzMVwyMzFcMDAwXDMxNFwyMzFcMDAwXDM3N1wyMzErXDAwMFwyMzErM1wyMzErZlwyMzErXDIzMVwyMzErXDMxNFwyMzErXDM3N1wyMzFVXDAwMFwyMzFVM1wyMzFVZlwyMzFVXDIzMVwyMzFVXDMxNFwyMzFVXDM3N1wyMzFcMjAwXDAwMFwyMzFcMjAwM1wyMzFcMjAwZlwyMzFcMjAwXDIzMVwyMzFcMjAwXDMxNFwyMzFcMjAwXDM3N1wyMzFcMjUyXDAwMFwyMzFcMjUyM1wyMzFcMjUyZlwyMzFcMjUyXDIzMVwyMzFcMjUyXDMxNFwyMzFcMjUyXDM3N1wyMzFcMzI1XDAwMFwyMzFcMzI1M1wyMzFcMzI1ZlwyMzFcMzI1XDIzMVwyMzFcMzI1XDMxNFwyMzFcMzI1XDM3N1wyMzFcMzc3XDAwMFwyMzFcMzc3M1wyMzFcMzc3ZlwyMzFcMzc3XDIzMVwyMzFcMzc3XDMxNFwyMzFcMzc3XDM3N1wzMTRcMDAwXDAwMFwzMTRcMDAwM1wzMTRcMDAwZlwzMTRcMDAwXDIzMVwzMTRcMDAwXDMxNFwzMTRcMDAwXDM3N1wzMTQrXDAwMFwzMTQrM1wzMTQrZlwzMTQrXDIzMVwzMTQrXDMxNFwzMTQrXDM3N1wzMTRVXDAwMFwzMTRVM1wzMTRVZlwzMTRVXDIzMVwzMTRVXDMxNFwzMTRVXDM3N1wzMTRcMjAwXDAwMFwzMTRcMjAwM1wzMTRcMjAwZlwzMTRcMjAwXDIzMVwzMTRcMjAwXDMxNFwzMTRcMjAwXDM3N1wzMTRcMjUyXDAwMFwzMTRcMjUyM1wzMTRcMjUyZlwzMTRcMjUyXDIzMVwzMTRcMjUyXDMxNFwzMTRcMjUyXDM3N1wzMTRcMzI1XDAwMFwzMTRcMzI1M1wzMTRcMzI1ZlwzMTRcMzI1XDIzMVwzMTRcMzI1XDMxNFwzMTRcMzI1XDM3N1wzMTRcMzc3XDAwMFwzMTRcMzc3M1wzMTRcMzc3ZlwzMTRcMzc3XDIzMVwzMTRcMzc3XDMxNFwzMTRcMzc3XDM3N1wzNzdcMDAwXDAwMFwzNzdcMDAwM1wzNzdcMDAwZlwzNzdcMDAwXDIzMVwzNzdcMDAwXDMxNFwzNzdcMDAwXDM3N1wzNzcrXDAwMFwzNzcrM1wzNzcrZlwzNzcrXDIzMVwzNzcrXD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dgW4vyGdcbrurUDcx0ICIpghgIEXxJbQrM5VGW80UNYqVoVY2HyAPVkiilrSfhoJswmtEnVap//hxrqpHPz2LFtMkWo+bksreKb9Ddh3mkeTlJlnxb8yiJBIjEb/hEXKbS6lbln91mfrv5GW4OAABwFMxK8ZwxM/BVPmtcG5lhwBsdvGBXtqsaBYeid4jYC9IezzJV/X6IPFAdm9jzP7s8voAwD5+2Q9dAd6ZpM6oaTPgENGKTDZrq/v36zP9NrYhXqZ9KIKKtUel3oeeGr/lAdNo81pvKNWJx+8MttrYAAICjIBNhmNvl0C8tCKODkOuh74N2iE2sRD0akMl+d6qGOfiEPTA5a01CCc+7yJPydK31EbgG7vgJw85RFZtuDsJVMVJ3Spb/zeacjcH9jmXGlr4cTHPQnA1kD2TQunZQBM3GKhXVn/Xl5u38FjYHAAA4CpYsdmG7nGWz8qUf0YIvd9jbXRV/qSIIqiN5vsWcybLJPNw1ezIVx3wR9c1zlTo3h3l3pt2/QbT1F/+9qrD+IejMH0JS7uSoyk43PCXTOt5YdbRbarvfcuKuptSR5lNXpD3430x5D4zLco5cI+gaKczBtsMrajeHcvIFbA4AAAAeiWKzXtTHBs76X4ldc8MXm11xl3u+qBSIAkGZAAAAAEjhplT3uuxRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMD9+X88HmLKDQplbmRzdHJlYW0NCmVuZG9iagoxNSAwIG9iago8PC9MZW5ndGggMjM3L1R5cGUvTWV0YWRhdGEvU3VidHlwZS9YTUw+PnN0cmVhbQ0KPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyI+CiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIC8+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+DQplbmRzdHJlYW0NCmVuZG9iagp4cmVmCjAgNQ0KMDAwMDAwMDAwMCA2NTUzNSBmDQowMDAwMDAwMDE4IDAwMDAwIG4NCjAwMDAwMDAxMDcgMDAwMDAgbg0KMDAwMDAwMDE0MiAwMDAwMCBuDQowMDAwMDAwMTk0IDAwMDAwIG4NCjYgMTANCjAwMDAwMDAzNzAgMDAwMDAgbg0KMDAwMDAwMDQ0NiAwMDAwMCBuDQowMDAwMDAwNDY5IDAwMDAwIG4NCjAwMDAwMDA2NzEgMDAwMDAgbg0KMDAwMDAwMTI5MiAwMDAwMCBuDQowMDAwMDAxMzE2IDAwMDAwIG4NCjAwMDAwMDE0MDYgMDAwMDAgbg0KMDAwMDAwMzMyNiAwMDAwMCBuDQowMDAwMDA2NTgxIDAwMDAwIG4NCjAwMDAwMTkxMDAgMDAwMDAgbg0KdHJhaWxlcgo8PC9Sb290IDEgMCBSL0luZm8gNCAwIFIvSURbPDM1MzYyRDM1MzgyRDMyMzAyRDM2MzcyRDMyMzYyRDMyPjwzNTM2MkQzNTM4MkQzMjMwMkQzNjM3MkQzMjM2MkQzMj5dL1NpemUgMTY+PgpzdGFydHhyZWYKMTk0MTUKJSVFT0YK</base64Binary>'
//    aa.print(returnedXML)
//    var path = "c:\\temp\\test.pdf";
//    fout = aa.io.FileOutputStream(path);
//    fout.write(doc);
//    fout.flush();
//    fout.close();
//    aa.print("Should be there")
//}
//catch (ex) {
//    aa.print(ex.message)
//}


//pod1130200001.pdf
//toc122120.pdf
//var path = "c:\\temp\\pod1130200001.pdf";
//fout = aa.io.FileOutputStream(path);
//fout.write(result.bytes);
//fout.flush();
//fout.close();

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


