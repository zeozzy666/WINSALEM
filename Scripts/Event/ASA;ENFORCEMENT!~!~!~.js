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

//Get owners
var capId = aa.cap.getCapID("GRS-21-00020").getOutput()
var owners = aa.owner.getOwnerByCapId(capId).getOutput()
//aa.print(owners[0].getOwnerFullName());
for (x in owners) {
    if (owners[x].getOwnerFullName()) {
        if (owners[x].getOwnerFullName().toUpperCase().indexOf("CITY OF") > -1) {

            addStdCondition("Condition1", "City Owned")
            aa.print(owners[x].getOwnerFullName().toUpperCase());
        }
        
    }
    
}

//function addStdCondition(cType, cDesc) // optional cap ID
//{

//    var itemCap = capId;
//    if (arguments.length == 3) {
//        itemCap = arguments[2]; // use cap ID specified in args
//    }
//    if (!aa.capCondition.getStandardConditions) {
//        logDebug("addStdCondition function is not available in this version of Accela Automation.");
//    } else {
//        standardConditions = aa.capCondition.getStandardConditions(cType, cDesc).getOutput();
//        aa.print(standardConditions.length)
//        for (i = 0; i < standardConditions.length; i++)
//        // deactivate strict match for indy
//        //if (standardConditions[i].getConditionType().toUpperCase() == cType.toUpperCase() && standardConditions[i].getConditionDesc().toUpperCase() == cDesc.toUpperCase()) //EMSE Dom function does like search, needed for exact match
//        {
//            standardCondition = standardConditions[i];

//            var addCapCondResult = aa.capCondition.addCapCondition(itemCap, standardCondition.getConditionType(), standardCondition.getConditionDesc(), standardCondition.getConditionComment(), sysDate, null, sysDate, null, null, standardCondition.getImpactCode(), systemUserObj, systemUserObj, "Applied", currentUserID, "A", null, standardCondition.getDisplayConditionNotice(), standardCondition.getIncludeInConditionName(), standardCondition.getIncludeInShortDescription(), standardCondition.getInheritable(), standardCondition.getLongDescripton(), standardCondition.getPublicDisplayMessage(), standardCondition.getResolutionAction(), null, null, standardCondition.getConditionNbr(), standardCondition.getConditionGroup(), standardCondition.getDisplayNoticeOnACA(), standardCondition.getDisplayNoticeOnACAFee(), standardCondition.getPriority(), standardCondition.getConditionOfApproval());

//            if (addCapCondResult.getSuccess()) {
//                logDebug("Successfully added condition (" + standardCondition.getConditionDesc() + ")");
//            } else {
//                logDebug("**ERROR: adding condition (" + standardCondition.getConditionDesc() + "): " + addCapCondResult.getErrorMessage());
//            }
//        }
//    }
//}

//function logDebug(z) {
//    aa.print(z)
//}