if (matches(inspResult, "Pass", "In Compliance"))
{
	removeASITable("VIOLATIONS");
}
else
{
	var gsItems = getGuideSheetObjects(inspId);
	var vTable = loadASITable("VIOLATIONS") || new Array();
	var atLeast1 = false;
	for (g in gsItems)
	{
		if (!matches(gsItems[g].status, "Pass"))
		{
			var thisItem = gsItems[g];
			var row = new Array();
			row["Violation"] = thisItem.text;
			row["Status"] = thisItem.status;
			row["Inspector Comment"] = thisItem.comment;
			vTable.push(row);
			atLeast1 = true;
		}
	}
	if (atLeast1)
	{
		removeASITable("VIOLATIONS");
		addASITable("VIOLATIONS", vTable);
	}
}
var workflowStatus = lookup("WINSALEM_SETTINGS_INSPXWORKLOW", inspResult);
if (!isBlank(workflowStatus))
{
	resultWorkflowTask("Follow-Up Investigation", workflowStatus, "Updated via IRSA", "");
}

//Get fees not yet invoices and invoice them when Insp type is Final Inspection and insp result is Case Closed'
if (inspType == "Final" && inspResult == "Approved") {

	closeTask("Final Inspection", "Approved", "Closed byt script in IRSA", "Closed byt script in IRSA")
	var parent = getParents("Enforcement/Action Order/NA/NA");
	if (parent) {
		logDebug("Got parent: " + parent)
		//var holdCap = capId;
		//closeTask("Final Inspection", "Approved", "Closed byt script in IRSA", "Closed byt script in IRSA")
		//If we have the parent at this point then close task action order with status of closed. Close record status with Closed.
    }
}
