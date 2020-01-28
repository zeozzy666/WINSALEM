var recordType = lookup("ENF_INITIAL_INSP_MAPPING", inspResult);
if (recordType)
{
	var newCap = createCap(recordType, "");
	var linkResult = aa.cap.createAppHierarchy(capId, newCap);
	if (linkResult.getSuccess())
		logDebug("Successfully linked to Parent Application");
	else
		logDebug( "**ERROR: linking to parent application parent cap " + linkResult.getErrorMessage());	
}