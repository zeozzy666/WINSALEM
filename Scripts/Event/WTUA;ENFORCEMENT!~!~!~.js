if ("Request Inspection Warrant".equals(wfStatus))
{
	var recordType = "Enforcement/Case/Warrant/NA";
	//create warrant
	var newCap = createCap(recordType, "");
	//copy APO
	copyAddresses(capId, newCap);
	copyParcels(capId, newCap);
	copyOwner(capId, newCap);
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
	copyOwner(capId, newCap);
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
	copyOwner(capId, newCap);
	//copy asi
	copyMatchingCustomFields(capId, newCap);
	//link as child to AO
	var linkResult = aa.cap.createAppHierarchy(capId, newCap);
	if (linkResult.getSuccess())
		logDebug("Successfully linked to Parent Application");
	else
		logDebug( "**ERROR: linking to parent application parent cap " + linkResult.getErrorMessage());		
}
else if ("Abatement".equals(wfTask) && (matches(wfStatus, "Abated by Contractor", "Abated by Crew"))) {
	if (matches(appTypeArray[2], "Brush", "Curbside", "Trash")) {
		updateFee("ENVIR_04", "ENF_ENVIR", "FINAL", 1, "N")
		updateFee("ENVIR_05", "ENF_ENVIR", "FINAL", 1, "N")
		updateFee("ENVIR_14", "ENF_ENVIR", "FINAL", 1, "N")
	}
	else if (matches(appTypeArray[2], "Shrubbery")) {
		updateFee("ENVIR_02", "ENF_ENVIR", "FINAL", 1, "N")
		updateFee("ENVIR_01", "ENF_ENVIR", "FINAL", 1, "N")
		updateFee("ENVIR_12", "ENF_ENVIR", "FINAL", 1, "N")
	}
	else if (matches(appTypeArray[2], "Grass")) {
		updateFee("ENVIR_02", "ENF_ENVIR", "FINAL", 1, "N")
		updateFee("ENVIR_01", "ENF_ENVIR", "FINAL", 1, "N")
		updateFee("ENVIR_03", "ENF_ENVIR", "FINAL", 1, "N")
	}
	else if (matches(appTypeArray[2], "Leaves")) {
		updateFee("ENVIR_15", "ENF_ENVIR", "FINAL", 1, "N")
	}
}
else if ("Close Action Order".equals(wfTask) && "Closed".equals(wfStatus))
{
	var aOrder = getParent();
	if (aOrder)
	{
		resultWorkflowTask("Case", "Closed", "Updated via WTUA", "", null, aOrder);
	}
}