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
	var newInspId = scheduleInspect(newCap, "Follow-Up Investigation", 14);
	//Copy failed GSIs
	copyFailedGuidesheetItems(capId, inspId, newCap, newInspId);
	//Create GIS object
	copyParcelGisObjects(newCap);
	//update gis info
	updateGISCapInfo(newCap);
	//copy contacts
	copyContacts(capId, newCap);
	//assign new cap
	var gisInspector = getGISInfo("WINSALEM", "GISADMIN.Code_Enforcement_Territories", "NCO");
	var accelaInspector = lookup("WINSALEM_SETTINGS_GIS_INSPECTORS", gisInspector);
	if (accelaInspector)
		assignCap(accelaInspector, newCap);
	//Update workflow
	if ("No Violation".equals(inspResult))
		resultWorkflowTask("Initial Investigation", "No Violation", "Updated via IRSA", "");
	else if ("Request Inspection Warrant".equals(inspResult))
		resultWorkflowTask("Initial Investigation", "Request Inspection Warrant", "Updated via IRSA", "");
	else
		resultWorkflowTask("Initial Investigation", "In Violation", "Updated via IRSA", "");

	//link as child to AO
	var linkResult = aa.cap.createAppHierarchy(capId, newCap);
	if (linkResult.getSuccess())
		logDebug("Successfully linked to Parent Application");
	else
		logDebug( "**ERROR: linking to parent application parent cap " + linkResult.getErrorMessage());	
}