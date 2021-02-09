logDebug("publicUser " + publicUser)
if (!publicUser) {
    copyParcelGisObjects();
}

if (!matches(appTypeArray[1], "Action Order")) {
    scheduleInspection("Initial Inspection", 14, currentUserID);
}
else {
    var newInspId = 0;
    logDebug("getAppSpecific(Request Type): " + getAppSpecific("Request Type"))
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
//aa.sendMail("noReply@Winsalem.com", "mwells@accela.com", "", "Debug Messages", debug)
//update GIS info
updateGISCapInfo();

//Get owners. Add condition if City Owned
var owners = aa.owner.getOwnerByCapId(capId).getOutput()
for (x in owners) {
    if (owners[x].getOwnerFullName()) {
        if (owners[x].getOwnerFullName().toUpperCase().indexOf("CITY OF") > -1) {

            addStdCondition("Condition1", "City Owned")
        } 
    }  
}
