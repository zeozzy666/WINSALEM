var SCRIPT_VERSION = "3.0";
var BATCH_NAME = "";
eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", null, true));
eval(getScriptText("INCLUDES_ACCELA_GLOBALS", null, true));
eval(getScriptText("INCLUDES_CUSTOM", null, true));
var currentUserID = "ADMIN";
function getScriptText(vScriptName, servProvCode, useProductScripts) {
    if (!servProvCode)
        servProvCode = aa.getServiceProviderCode();
    vScriptName = vScriptName.toUpperCase();
    var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
    try {
        if (useProductScripts) {
            var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);
        } else {
            var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
        }
        return emseScript.getScriptText() + "";
    } catch (err) {
        return "";
    }
}
logMessage = function (etype, edesc) {
    aa.print(etype + " : " + edesc);
}
logDebug = function (edesc) {
    if (showDebug) {
        aa.print("DEBUG : " + edesc);
    }
}
/*------------------------------------ USER PARAMETERS ---------------------------------------*/
var appType = aa.env.getValue("Record");
var status2Skip = aa.env.getValue("Status2Skip");
//TESTING
//appType = "Enforcement/*/*/*";
//status2Skip = "Closed";
/*------------------------------------ END OF USER PARAMETERS --------------------------------*/

var showDebug = true; // Set to true to see debug messages
var maxSeconds = 5 * 60; // number of seconds allowed for batch processing,
// usually < 5*60
var startDate = new Date();
var timeExpired = false;
var startTime = startDate.getTime(); // Start timer
var sysDate = aa.date.getCurrentDate();
var batchJobID = aa.batchJob.getJobID().getOutput();
var systemUserObj = aa.person.getUser("ADMIN").getOutput();
var servProvCode = aa.getServiceProviderCode();
var capId = null;
var altId = "";

logMessage("START", "Start of Job");
if (!timeExpired) mainProcess();
logMessage("END", "End of Job: Elapsed Time : " + elapsed() + " Seconds");

function mainProcess() {
    var capIDListOutput,
    capIDList = new Array(),
    capTypeModel,
    capModel;
    var appTypeArray = appType.split("/");
    var status2SkipArray = status2Skip.split(",");

    // Capturing the CapType Model
    capTypeModel = aa.cap.getCapTypeModel().getOutput();
    appTypeArray[0] == "*" ? capTypeModel.setGroup(null) : capTypeModel.setGroup(appTypeArray[0]);
    appTypeArray[1] == "*" ? capTypeModel.setType(null) : capTypeModel.setType(appTypeArray[1]);
    appTypeArray[2] == "*" ? capTypeModel.setSubType(null) : capTypeModel.setSubType(appTypeArray[2]);
    appTypeArray[3] == "*" ? capTypeModel.setCategory(null) : capTypeModel.setCategory(appTypeArray[3]);
    // Getting Cap Model
    capModel = aa.cap.getCapModel().getOutput();
    capModel.setCapType(capTypeModel);
    //capModel.setCapStatus(appStatus);    
    capIDListOutput = aa.cap.getCapIDListByCapModel(capModel).getOutput();
    for (var c in capIDListOutput)
    {
        capId = aa.cap.getCapID(capIDListOutput[c].getID1(), capIDListOutput[c].getID2(), capIDListOutput[c].getID3()).getOutput();
        altId = capId.getCustomID();
        var capStatus = getAppStatus(capId) || "";
        if (exists(capStatus, status2SkipArray) || capStatus.indexOf("Close") >= 0)
            { logDebug(altId + ": " + capStatus + " is a skip status, skipping..."); continue; }
        var docs = getDocumentList();
        for (var d in docs)
        {
            var thisDoc = docs[d];
            var thisDocSeq = thisDoc.getDocumentNo();
            var thisTrackingStatus = getDocCustomField(thisDocSeq, "Status");
            //refresh tracking info if not delivered
            if (!matches(thisTrackingStatus, "Delivered"))
                var success = refreshDocTracking(thisDocSeq);
        }
    }

}

function elapsed() {
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    return ((thisTime - startTime) / 1000)
}

function sendMail(from, to, cc, templateName, params, fileNames)
{
    // var fileNames = [];
    var result = aa.document.sendEmailByTemplateName(from, to, cc, templateName, params, fileNames);
    if(result.getSuccess())
    {
        aa.print("Send mail success.");
    }
    else
    {
        aa.print("Send mail fail.");
    }
}

 