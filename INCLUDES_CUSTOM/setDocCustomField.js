function setDocCustomField(docSeqNum, fieldName, fieldValue, useSubGroup)
{
	var itemCap = capId;
	if (arguments.length > 4)
		itemCap = arguments[4];
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
					thisASI.setDefaultValue(fieldValue);
					var updateResult = aa.document.updateDocument(doc);
					if (updateResult.getSuccess())
						{ logDebug(capIDString + ": Successfully updated doc number " + docSeqNum); return true; }
					else
						{ logDebug(capIDString + ": Problem updating document " + docSeqNum + " " + updateResult.getErrorMessage()); return false; }
				}
			}
		}
	}
	return false;
}