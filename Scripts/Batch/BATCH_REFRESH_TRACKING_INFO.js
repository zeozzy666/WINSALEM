//#region Load Environment
var SCRIPT_VERSION = "3.0";
var BATCH_NAME = "";
eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", null, true));
eval(getScriptText("INCLUDES_ACCELA_GLOBALS", null, true));
eval(getScriptText("INCLUDES_CUSTOM", null, true));
var currentUserID = "ADMIN";
//#endregion

//#region Batch Parameters
var pTargetDate = aa.env.getValue("Target Date");
//#endregion

//#region Parameters for TESTING
// appType = "Enforcement/*/*/*";
// status2Skip = "Closed";
//#endregion

//#region Batch Globals
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
logMessage = function (etype, edesc) {
    aa.print(etype + " : " + edesc);
}
logDebug = function (edesc) {
    if (showDebug) {
        aa.print("DEBUG : " + edesc);
    }
}
//#endregion

logMessage("START", "Start of Job");
if (!timeExpired) mainProcess();
logMessage("END", "End of Job: Elapsed Time : " + elapsed() + " Seconds");

//#region Main
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
    for (var c in capIDListOutput) {
        capId = aa.cap.getCapID(capIDListOutput[c].getID1(), capIDListOutput[c].getID2(), capIDListOutput[c].getID3()).getOutput();
        altId = capId.getCustomID();
        var capStatus = getAppStatus(capId) || "";
        if (exists(capStatus, status2SkipArray) || capStatus.indexOf("Close") >= 0) { logDebug(altId + ": " + capStatus + " is a skip status, skipping..."); continue; }
        //refresh tracking
        refreshDocTrackingASIT(capId);

    }

}
//#endregion

//#region Private Functions
function elapsed() {
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    return ((thisTime - startTime) / 1000)
}
function getRecords() {
    var sql = "SELECT DISTINCT B1_ALT_ID FROM dbo.B1PERMIT B INNER JOIN dbo.BAPPSPECTABLE_VALUE ASIT ON ASIT.SERV_PROV_CODE = B.SERV_PROV_CODE AND ASIT.B1_PER_ID1 = B.B1_PER_ID1 AND ASIT.B1_PER_ID2 = B.B1_PER_ID2 AND ASIT.B1_PER_ID3 = B.B1_PER_ID3 WHERE ASIT.TABLE_NAME = 'HOURS' AND B.SERV_PROV_CODE = 'WINSALEM'";
    var array = new Array();
    try {
        var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
        var ds = initialContext.lookup("java:/WINSALEM");
        var conn = ds.getConnection();
        var sStmt = aa.db.prepareStatement(conn, sql);
        var rSet = sStmt.executeQuery();
        while (rSet.next()) {
            var obj = {};
            var md = rSet.getMetaData();
            var columns = md.getColumnCount();
            for (i = 1; i <= columns; i++) {
                var thiscapId = aa.cap.getCapID(String(rSet.getString(md.getColumnName(i)))).getOutput();
                array.push(thiscapId);
            }
        }

        return array;

    } catch (err) {
        aa.print(err.message);
    }
    finally {
        if (rSet)
            rSet.close();
        if (sStmt)
            sStmt.close();
        if (conn)
            conn.close();
    }
}
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
//#endregion

