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
