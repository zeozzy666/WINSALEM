
if (!publicUser) {
    copyParcelGisObjects();
}

if (!matches(appTypeArray[1], "Action Order")) {
    scheduleInspection("Initial Inspection", 14, currentUserID);
}
else {
    var newInspId = 0;
    newInspId = scheduleInspect(capId, "Initial Investigation", 1, null, getAppSpecific("Request Type"));
    //assign new cap
    var gisInspector = getGISInfo("WINSALEM", "GISADMIN.Code_Enforcement_Territories", "NCO");
    var accelaInspector = lookup("WINSALEM_SETTINGS_GIS_INSPECTORS", gisInspector);
    logDebug("accelaInspector: " + accelaInspector)
    if (accelaInspector) {
        assignInspection(parseInt(newInspId), accelaInspector);
        assignCap(accelaInspector);
    }

}
//update GIS info
updateGISCapInfo();