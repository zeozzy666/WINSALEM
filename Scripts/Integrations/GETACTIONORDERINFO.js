var result = new Object();
var messages = new Array();
var capId = null;
var currentUserID = "ADMIN";
var showDebug = false;
var debug = "";
var br = "<BR>"
var AInfo = new Array();
var useAppSpecificGroupName = false;
var enableLogging = aa.env.getValue("enableLogging");

try
{        
    eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", null, true));
    eval(getScriptText("INCLUDES_CUSTOM", null, true));  
}
catch(e1)
{
    addMessage("problem loading environment " + e1.message);
}
try
{
   var actionOrderId = aa.env.getValue("ActionOrderID");
   capId = aa.cap.getCapID(actionOrderId).getOutput();
   if (capId)
   {
    result.status = getAppStatus();
    var cases = getChildren("Enforcement/*/*/*") || new Array();
    if (cases.length > 0)
    {
      result.caseNumber = cases[0].getCustomID();
    }
   }
   else
   {
    addMessage("Invalid ActionOrderID");
   }

}
catch (err) 
{
    aa.env.setValue("returnCode", "-1"); // error
    aa.env.setValue("returnValue", err.message + " on line " + err.lineNumber);
    addMessage(err.message);
}
finally
{
	  result.messages = messages;    
    aa.env.setValue("returnCode", "1");
    aa.env.setValue("result", result);    
}
function logInfo(str)
{
  if (enableLogging == true)
    addMessage(str);
}
function addMessage(str)
{
    messages.push(str);
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