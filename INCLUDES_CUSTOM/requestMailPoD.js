function requestMailPoD(trackId, mpSuffix, mpDate)
{
	var settings = "WINSALEM_SETTINGS_USPS"
	var userId = lookup_noLog(settings, "USER_ID");
	var uri = lookup_noLog(settings, 'POD_URI');
	var email = lookup_noLog(settings, "POD_EMAIL");
	var fName = lookup_noLog(settings, "POD_FNAME");
	var lName = lookup_noLog(settings, "POD_LNAME");
	//For Testing
	//var userId = "645ACCEL3857";
	//var uri = 'https://secure.shippingapis.com/ShippingAPI.dll?API=PTSRre&XML=%3CPTSRreRequest%20USERID=%$$userid$$%22%3E%3CTrackId%3E$$trackid$$%3C/TrackId%3E%3CMpSuffix%3E$$mpSuffix$$%3C/MpSuffix%3E%3CMpDate%3E$$mpDate$$%3C/MpDate%3E%3CFirstName%3E$$fName$$%3C/FirstName%3E%3CLastName%3E$$lName$$%3C/LastName%3E%3CEmail1%3E$$email$$%3C/Email1%3E%3CTableCode%3ET%3C/TableCode%3E%3C/PTSRreRequest%3E';
	//var trackId = "9171999991703934968445";
	if (trackId)
	{
		//encoding
		mpDate = mpDate.replace(" ", "%20");
		//build uri
		uri = uri.replace("$$trackid$$", trackId);
		uri = uri.replace("$$userid$$", userId);
		uri = uri.replace("$$mpSuffix$$", mpSuffix);
		uri = uri.replace("$$mpDate$$", mpDate);
		uri = uri.replace("$$email$$", email);
		uri = uri.replace("$$fName$$", fName);
		uri = uri.replace("$$lName$$", lName);
		var restHeaders = aa.util.newHashMap();
		var requestBody = "";

		restHeaders.put("Content-Type", "application/x-www-form-urlencoded");
		restHeaders.put("Method", "POST");

		var r = aa.httpClient.post(uri, restHeaders, requestBody);
		if (r.getSuccess())
		{
			var xml = r.getOutput();
			logDebug("USPS Integration: Successfully requested PoD for " + trackId);
			var resultText = getNode(xml, "ResultText");
			logDebug("USPS Integration: USPS Responded with: " + resultText)

			return true;
		}
		else
			{ logDebug(capIDString + ": Problem while trying to retrieve PoD info: " + r.getErrorMessage()); return false; }
	}
}