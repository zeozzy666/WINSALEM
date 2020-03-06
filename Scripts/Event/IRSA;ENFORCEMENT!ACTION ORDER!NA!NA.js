var recordType = lookup("ENF_INITIAL_INSP_MAPPING", inspResult);
if (recordType)
{
	//create code case
	var newCap = createCap(recordType, "");
	//copy APO
	copyAddresses(capId, newCap);
	copyParcels(capId, newCap);
	copyOwner(capId, newCap);
	//copy asi
	copyMatchingCustomFields(capId, newCap);
	//copy ASIT
	copyASITables(capId, newCap);
	//create follow up inspection
	scheduleInspect(newCap, "Initial Inspection", 14);	
	//link as child to AO
	var linkResult = aa.cap.createAppHierarchy(capId, newCap);
	if (linkResult.getSuccess())
		logDebug("Successfully linked to Parent Application");
	else
		logDebug( "**ERROR: linking to parent application parent cap " + linkResult.getErrorMessage());	
}