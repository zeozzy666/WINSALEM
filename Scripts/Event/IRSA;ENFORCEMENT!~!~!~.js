if (matches(inspResult, "Pass", "Fail") || true)
{
	var gsItems = getGuideSheetObjects(inspId);
	var vTable = new Array();
	for (g in gsItems)
	{
		var thisItem = gsItems[g];
		var row = new Array();
		row["Violation"] = thisItem.text;
		row["Status"] = thisItem.status;
		row["Inspector Comment"] = thisItem.comment;
		vTable.push(row);
	}
	removeASITable("VIOLATIONS");
	addASITable("VIOLATIONS", vTable);
}