if (!matches(appTypeArray[1], "Action Order"))
{
	scheduleInspection("Initial Inspection", 14, currentUserID);
}
else
{
	var newInspId = 0;
	newInspId = scheduleInspect(capId, "Initial Investigation", 1, null, AInfo["Request Type"]);
	//assign new cap
	var gisInspector = getGISInfo("WINSALEM", "GISADMIN.Code_Enforcement_Territories", "NCO");
	var accelaInspector = lookup("WINSALEM_SETTINGS_GIS_INSPECTORS", gisInspector);
	if (accelaInspector)
	{
		assignInspection(parseInt(newInspId), accelaInspector);
		assignCap(accelaInspector);
	}
		
}
try {
	//Is this why the GIS object does not get created from the mobile app?
	if(!publicUser){
		copyParcelGisObjects();
	}
} catch (err) {
	logDebug("A JavaScript Error occurred: ASA:ENFORCEMENT/*/*/*: copyParcelGisObjects()" + err.message);
	logDebug(err.stack);
};

//update GIS info
updateGISCapInfo();