var settings = "WINSALEM_SETTINGS_USPS"
var trackId = getDocCustomField(documentModel.documentNo, "Tracking Number");
//var trackId = "9171999991703934968445";
var userId = lookup(settings, "USER_ID");
//var userId = "645ACCEL3857";
var uri = lookup(settings, 'TRACK_URI');
//var uri = 'http://production.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=%3CTrackFieldRequest%20USERID=%22$$USERID$$%22%3E%3CRevision%3E1%3C/Revision%3E%3CClientIp%3E127.0.0.1%3C/ClientIp%3E%3CSourceId%3EUSPSTOOLS%3C/SourceId%3E%3CTrackID%20ID=%22$$TRACKID$$%22/%3E%3C/TrackFieldRequest%3E';
uri = uri.replace("$$TRACKID$$", trackId);
uri = uri.replace("$$USERID$$", userId);
var restHeaders = aa.util.newHashMap();
var requestBody = "";

restHeaders.put("Content-Type", "application/x-www-form-urlencoded");
//restHeaders.put("Accept", "application/x-www-form-urlencoded");
restHeaders.put("Method", "POST");

var r = aa.httpClient.post(uri, restHeaders, requestBody);
if (r.getSuccess())
{
	var node = getNode(r.getOutput(), "TrackSummary");
	aa.print(node);
	//aa.print(r.getOutput())
}
else
{
}