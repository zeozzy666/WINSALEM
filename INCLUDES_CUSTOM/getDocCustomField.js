function getDocCustomField(docSeqNum, fieldName, useSubGroup)
{
	var itemCap = capId;
	if (arguments.length > 3)
		itemCap = arguments[3];
	var doc = aa.document.getDocumentByPK(docSeqNum).getOutput();
	if (!doc)
		return false;
	var docTemplate = doc.getTemplate().getTemplateForms().get(0).getSubgroups().toArray();
	for (var sg in docTemplate)
	{
		var thisSubgroup = docTemplate[sg];
		if (!useSubGroup || thisSubgroup.getSubgroupName().equals(useSubGroup.toUpperCase()))
		{
			var thisSubgroupFields = thisSubgroup.getFields().toArray();
			for (var asi in thisSubgroupFields)
			{
				var thisASI = thisSubgroupFields[asi];
				if (fieldName.equals(thisASI.getCheckboxDesc()))
				{
					return thisASI.getChecklistComment();
				}
			}
		}
	}
	return false;
}