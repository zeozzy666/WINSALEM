var recordType = lookup("ENF_INITIAL_INSP_MAPPING", inspResult);
if (recordType)
{
	//create code case
	var newCap = createCap(recordType, "");
	//copy APO
	copyAddresses(capId, newCap);
	copyParcels(capId, newCap);
	copyOwner(capId, newCap);
	copyDocuments(capId, newCap)
	//copy asi
	copyMatchingCustomFields(capId, newCap);
	//copy ASIT
	copyASITables(capId, newCap);
	//create follow up inspection
	var newInspId = 0;
	//newInspId = scheduleInspect(newCap, "Follow-Up Investigation", 14);
	createPendingInspFromReqd(newCap);
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
	{
		assignCap(accelaInspector, newCap);
		//assignInspection(parseInt(newInspId), accelaInspector)
	}
		
	//Update workflow
	if ("No Violation".equals(inspResult))
		resultWorkflowTask("Initial Investigation", "No Violation", "Updated via IRSA", "");
	else if ("Request Inspection Warrant".equals(inspResult))
		resultWorkflowTask("Initial Investigation", "Request Inspection Warrant", "Updated via IRSA", "");
	else
		resultWorkflowTask("Initial Investigation", "In Violation", "Updated via IRSA", "");

	//Close out AO if environmental
	if (appMatch("Enforcement/Environmental/*/*", newCap) && !appMatch("Enforcement/Environmental/Vector/Rats", newCap))
	{

		//resultWorkflowTask("Case", "Closed", "Updated via IRSA", "");
		//Update case workflow if city owned
		if ("City Owned".equals(AInfo["Owner or Tenant"]))
		{
			deactivateTask("Notification", null, newCap);
			deactivateTask("Follow-Up Investigation", null, newCap);
			activateTask("Abatement", null, newCap)
		}
	}		

	//link as child to AO
	var linkResult = aa.cap.createAppHierarchy(capId, newCap);
	if (linkResult.getSuccess())
		logDebug("Successfully linked to Parent Application");
	else
		logDebug( "**ERROR: linking to parent application parent cap " + linkResult.getErrorMessage());

	//#region new record automations
	if (matches(inspResult, "Minimum Housing - Minor", "Abandoned Structure", "Vacant Non-Residential"))
	{
		resultWorkflowTask("Research", "NA", "Updated via IRSA", "", null, newCap);
		if ("Minimum Housing - Minor".equals(inspResult))
		{
			var minHousMinAssignTo = lookup("WINSALEM_SETTINGS", "MINIMUM_HOUSING_R_ASSIGN");
			if (!isBlank(minHousMinAssignTo))
				assignCap(minHousMinAssignTo, newCap);
		}
			
	}
	//#endregion
}