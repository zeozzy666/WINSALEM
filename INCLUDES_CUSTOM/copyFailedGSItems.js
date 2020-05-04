//copy failed guidesheet (checklist) items from one inspection to another in the same record 
function copyFailedGuidesheetItems(srcCapID, srcInspID, destCapID, destInspID)
{
	// Ensure we have the actual capModels to pick from and copy to.
	if (srcCapID == null || destCapID == null)
	{
		logDebug("Trying to copy to or from nothing, skipping.");
		return false;
	}
	var failList = aa.util.newArrayList();
	// The following section is almost like getGuideSheetItems, but doesn't drill as far down.
	// Get the inspections of the cap
	var res = aa.inspection.getInspections(srcCapID);
	// Bail if the call failed.
	if (!res.getSuccess())
	{
		logDebug("**ERROR: aa.inspection.getInspections() failed: "+res.getErrorMessage());
		return false;
	}
	var inspArr = res.getOutput();
	// Ensure we got an inspection in the array
	if (inspArr == null || inspArr.length == 0)
	{
		logDebug("No inspections on source cap, skipping");
		return false;
	}
	// Find our inspection we want.
	for (var h in inspArr)
	{
		// IF it is the requested inspection, check the checklists.
		if (inspArr[h].getIdNumber() == srcInspID)
		{
			// I'm assuming inspArr[h].getInspection() will never be null
			var gs = inspArr[h].getInspection().getGuideSheets();
			// Ensure there are checklists on the inspection
			if (gs != null)
			{
				// Get the guideSheet list from the ArrayList returned.
				var gsArray = gs.toArray();
				for (var i in gsArray)
				{
					// Get the items in the guidesheet.
					var items = gsArray[i].getItems().toArray();
					for (var j in items)
					{
						var item = items[j];
						// Make sure we have a visible Fail option on the item.
                        if ((item.getGuideItemStatus().toUpperCase().indexOf("FAIL") >= 0 || 
                        item.getGuideItemStatus().toUpperCase().indexOf("NON COMPLIANT") >= 0 ||
                        item.getGuideItemStatus().toUpperCase().indexOf("NON-COMPLIANT") >= 0) && item.getGuideItemStatusVisible() == "Y")
						{
							// Add the checklist sheet to the list to copy.
							failList.add(gsArray[i]);
							// The guidesheet failed, don't check it any more
							break;
						}
					}
				}
			}
		}
	}
	// Ensure that we found something to copy.
	if (failList.size() == 0)
	{
		logDebug("No failed guidesheet items to copy.");
		return false;
	}
	// Copy the guidesheet items -- assume currentUserID is defined in the calling scope.
	res = aa.guidesheet.copyGGuideSheetItems(failList, destCapID, parseInt(destInspID), currentUserID);
	if (res.getSuccess())
	{
		logDebug("Copied successfully.");
		return true;
	}
	else
	{
		logDebug("**ERROR: Failed to copy: "+res.getErrorMessage());
		return false;
	}
}