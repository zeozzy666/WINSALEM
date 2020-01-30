if (matches(inspResult, "Pass", "Fail") || true)
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