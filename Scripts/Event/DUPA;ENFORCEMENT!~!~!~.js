var requestPOD = getDocCustomField(documentModel.documentNo, "Request POD");
if ("CHECKED".equals(requestPOD))
{
	refreshDocTracking(documentModel.documentNo, true);
	setDocCustomField(documentModel.documentNo, "Request POD", "UNCHECKED");
}
else
{
	refreshDocTracking(documentModel.documentNo);
}
