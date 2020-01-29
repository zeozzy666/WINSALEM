if ("Request Inspection Warrant".equals(wfStatus))
{
	var recordType = "Enforcement/Case/Warrant/NA";
	//create warrant
	var newCap = createCap(recordType, "");
	//copy APO
	copyAddresses(capId, newCap);
	copyParcels(capId, newCap);
	copyOwners(capId, newCap);
	//copy asi
	copyMatchingCustomFields(capId, newCap);
	//link as child to AO
	var linkResult = aa.cap.createAppHierarchy(capId, newCap);
	if (linkResult.getSuccess())
		logDebug("Successfully linked to Parent Application");
	else
		logDebug( "**ERROR: linking to parent application parent cap " + linkResult.getErrorMessage());		
}
else if ("Request Order of Abatement".equals(wfStatus))
{
	var recordType = "Enforcement/Case/Orders/Abatement";
	//create abatement
	var newCap = createCap(recordType, "");
	//copy APO
	copyAddresses(capId, newCap);
	copyParcels(capId, newCap);
	copyOwners(capId, newCap);
	//copy asi
	copyMatchingCustomFields(capId, newCap);
	//link as child to AO
	var linkResult = aa.cap.createAppHierarchy(capId, newCap);
	if (linkResult.getSuccess())
		logDebug("Successfully linked to Parent Application");
	else
		logDebug( "**ERROR: linking to parent application parent cap " + linkResult.getErrorMessage());	
}
else if ("Council Approval".equals(wfTask) && "Approved".equals(wfStatus))
{
	var recordType = "Enforcement/Demolitions/NA/NA";
	//create demo
	var newCap = createCap(recordType, "");
	//copy APO
	copyAddresses(capId, newCap);
	copyParcels(capId, newCap);
	copyOwners(capId, newCap);
	//copy asi
	copyMatchingCustomFields(capId, newCap);
	//link as child to AO
	var linkResult = aa.cap.createAppHierarchy(capId, newCap);
	if (linkResult.getSuccess())
		logDebug("Successfully linked to Parent Application");
	else
		logDebug( "**ERROR: linking to parent application parent cap " + linkResult.getErrorMessage());		
}