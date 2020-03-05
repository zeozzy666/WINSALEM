var settings = "WINSALEM_SETTINGS_USPS"
var trackId = getDocCustomField(documentModel.documentNo, "Tracking Number");
var userId = lookup(settings, "USER_ID");
var uri = lookup(settings, 'TRACK_URI');
//For Testing
//var userId = "645ACCEL3857";
//var uri = 'http://production.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=%3CTrackFieldRequest%20USERID=%22$$USERID$$%22%3E%3CRevision%3E1%3C/Revision%3E%3CClientIp%3E127.0.0.1%3C/ClientIp%3E%3CSourceId%3EUSPSTOOLS%3C/SourceId%3E%3CTrackID%20ID=%22$$TRACKID$$%22/%3E%3C/TrackFieldRequest%3E';
//var trackId = "9171999991703934968445";

uri = uri.replace("$$TRACKID$$", trackId);
uri = uri.replace("$$USERID$$", userId);
var restHeaders = aa.util.newHashMap();
var requestBody = "";

restHeaders.put("Content-Type", "application/x-www-form-urlencoded");
restHeaders.put("Method", "POST");

var r = aa.httpClient.post(uri, restHeaders, requestBody);
if (r.getSuccess())
{
	var xml = r.getOutput();
	logDebug(capIDString +": Successfully retrieved tracking info for " + trackId);
	//logDebug(capIDString + ": raw tracking info " + xml);
	var summNode = getNode(xml, "TrackSummary");
	var status = getNode(summNode, "EventStatusCategory");
	var statusDate = getNode(summNode, "EventDate");
	var statusTime = getNode(summNode, "EventTime");


	setDocCustomField(documentModel.documentNo, "Status", status);
	setDocCustomField(documentModel.documentNo, "Status Date", statusDate);
	setDocCustomField(documentModel.documentNo, "Status Time", statusTime);
	//aa.print(r.getOutput())
}
else
	{ logDebug(capIDString + ": Problem while trying to retrieve tracking info: " + r.getErrorMessage()); }