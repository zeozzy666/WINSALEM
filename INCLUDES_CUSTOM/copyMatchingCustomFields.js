function copyMatchingCustomFields(fcapId, tcapId, useSubgroupName) {
    // get cap ASIs
    var from_AppSpecInfoResult = aa.appSpecificInfo.getByCapID(fcapId);
    if (from_AppSpecInfoResult.getSuccess()) {
        var from_AppspecObj = from_AppSpecInfoResult.getOutput();
    } else {
        logDebug("**ERROR: getting app specific info for Cap : " + from_AppSpecInfoResult.getErrorMessage());
        return null;
    }

    for (i in from_AppspecObj) {
        var itemName = from_AppspecObj[i].getCheckboxDesc();
        var itemValue = from_AppspecObj[i].getChecklistComment();
        var itemGroup = useSubgroupName ? from_AppspecObj[i].getCheckboxType() : null;

        // Edit cap ASIs
        var to_AppSpecInfoResult = aa.appSpecificInfo.editSingleAppSpecific(tcapId, itemName, itemValue, itemGroup);
        if (to_AppSpecInfoResult.getSuccess()) {
            logDebug("INFO: " + (itemGroup ? itemGroup + "." : "") + itemName + " was updated.");
        } else {
            logDebug("WARNING: " + (itemGroup ? itemGroup + "." : "") + itemName + " was not updated: " + to_AppSpecInfoResult.getErrorMessage());
        }
    }

    return true;
}