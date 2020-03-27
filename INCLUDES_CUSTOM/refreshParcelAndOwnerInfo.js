function refreshParcelAndOwnerInfo(capId) {
    // Refresh Parcel Data
    updateRefParcelToCap(capId);
    // Refresh Owners Data
    // step 1 remove parcel owners
    var capOwnersRes = aa.owner.getOwnerByCapId(capId);
    if (capOwnersRes.getSuccess()) {
        var capOwners = capOwnersRes.getOutput();
        for (i in capOwners) {
            if (capOwners[i].getUID()) { // Indecates that the owner is reference
                var removeRes = aa.owner.removeCapOwnerModel(capOwners[i]);
                if (!removeRes.getSuccess()) {
                    logDebug("Owner Remove Error: " + removeRes.getErrorMessage());
                }
            }
        }
    }
    // step 2 add parcels owners
    var parcels = aa.parcel.getParcelDailyByCapID(capId, null);
    if (parcels.getSuccess()) {
        parcels = parcels.getOutput();
        if (parcels && parcels.length > 0) {
            for (var i = 0; i < parcels.length; i++) {
                // get owner(s) by parcel(s)
                var parcelOwnersResult = aa.owner.getOwnersByParcel(parcels[i]);
                var parcelNbr = parcels[i].getParcelNumber();
                var parcelUID = parcels[i].getParcelModel().getUID();
                if (parcelOwnersResult.getSuccess()) {
                    var ownerArr = parcelOwnersResult.getOutput();
                    for (j = 0; j < ownerArr.length; j++) {
                        ownerArr[j].setCapID(capId);
                        var ownerCreateRes = aa.owner.createCapOwnerWithAPOAttribute(ownerArr[j]);
                        if (!ownerCreateRes.getSuccess()) {
                            logDebug("Owner Create Error: " + ownerCreateRes.getErrorMessage());
                        }
                    }
                } else {
                    logDebug("ERROR: Failed to get Owner(s) by Parcel(s): " + parcelOwnersResult.getErrorMessage());
                }
            }
        }
    }
}