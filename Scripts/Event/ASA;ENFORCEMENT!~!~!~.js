if (!matches(appTypeArray[1], "Action Order"))
{
	scheduleInspection("Initial Inspection", 14, currentUserID);
}
else
{
	var newInspId = 0;
	newInspId = scheduleInspect(newCap, "Initial Investigation", 1);
	//assign new cap
	var gisInspector = getGISInfo("WINSALEM", "GISADMIN.Code_Enforcement_Territories", "NCO");
	var accelaInspector = lookup("WINSALEM_SETTINGS_GIS_INSPECTORS", gisInspector);
	if (accelaInspector)
	{
		assignInspection(parseInt(newInspId), accelaInspector);
		assignCap(accelaInspector);
	}
		
}
//update GIS info
updateGISCapInfo();