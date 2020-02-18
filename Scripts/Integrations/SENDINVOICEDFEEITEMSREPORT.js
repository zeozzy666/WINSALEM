var result = new Object();
var message = "";
var capId = null;
var currentUserID = "ADMIN";
var showDebug = false;
var debug = "";
var br = "<BR>";
try
{        
    eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", null, true));
    eval(getScriptText("INCLUDES_CUSTOM", null, true));  
}
catch(e1)
{
    message += "problem loading environment " + e1.message + "\n";
}
try
{
    var fromDate = aa.env.getValue("FromDate");
    var toDate = aa.env.getValue("ToDate");
    var sendTo = lookup("WINSALEM_SETTINGS", "FMS_REPORT_SENDTO");

    main();

}
catch (err) 
{
    aa.env.setValue("returnCode", "-1"); // error
    aa.env.setValue("returnValue", err.message + " on line " + err.lineNumber);
    message += err.message + "\n";
}
finally
{
	result.message = message;
    aa.env.setValue("returnCode", "1");
    aa.env.setValue("result", result);
}
function getScriptText(vScriptName, servProvCode, useProductScripts) {
    if (!servProvCode)  servProvCode = aa.getServiceProviderCode();
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
function main()
{
    if (isBlank(fromDate) || isBlank(toDate))
        { message += "FromDate and ToDate are required\n"; return false; }
    if (isBlank(sendTo))
        { message += "FMS_REPORT_SENDTO is not configured in standard choice WINSALEM_SETTINGS\n"; return false; }

    var rParams = aa.util.newHashtable();
    rParams.put("RECORD_ID", "WAR-20-00005");
    var rFile = generateReport_Local("Notice of Violation - First Notice", "Enforcement", rParams);

    var subject = "Invoiced Fee Items for period $$fromdate$$ to $$todate$$".replace("$$fromdate$$", fromDate).replace("$$todate$$", toDate);
    var body = "Hello<BR><BR>Please find attached a copy of the Invoiced Fee Items report for the period $$fromdate$$ to $$todate$$<BR><BR>Thank you.".replace("$$fromdate$$", fromDate).replace("$$todate$$", toDate);
    var sendResult = aa.sendEmail("noreply@cityofws.org", sendTo, "", subject, body, rFile);
    if (sendResult.getSuccess())
      message += "Successfully sent report to " + sendTo + "\n";
    else
      message += "Error while trying to send email " + sendResult.getErrorMessage() + "\n";
}
function generateReport_Local(reportName,module,parameters) {

  //returns the report file which can be attached to an email.
  var user = currentUserID;   // Setting the User Name
  var report = aa.reportManager.getReportInfoModelByName(reportName);
  report = report.getOutput();
  report.setModule(module);
  report.setReportParameters(parameters); 

  var permit = aa.reportManager.hasPermission(reportName,user);

  if (permit.getSuccess()) {
    var reportResult = aa.reportManager.getReportResult(report);
    if(reportResult.getSuccess()) {
      reportOutput = reportResult.getOutput();
      var reportFile=aa.reportManager.storeReportToDisk(reportOutput);
      reportFile=reportFile.getOutput();
      return reportFile;
    }  else {
      aa.print("System failed get report: " + reportResult.getErrorType() + ":" +reportResult.getErrorMessage());
      return false;
    }
  } else {
    aa.print("You have no permission. " + permit.getErrorMessage());
    return false;
  }
}