function refreshDocTrackingASIT()
{
	var settings = "WINSALEM_SETTINGS_USPS"	
	var userId = lookup_noLog(settings, "USER_ID");
	var uri = lookup_noLog(settings, 'TRACK_URI');
	//For Testing
	//var userId = "645ACCEL3857";
	//var uri = 'http://production.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=%3CTrackFieldRequest%20USERID=%22$$USERID$$%22%3E%3CRevision%3E1%3C/Revision%3E%3CClientIp%3E127.0.0.1%3C/ClientIp%3E%3CSourceId%3EUSPSTOOLS%3C/SourceId%3E%3CTrackID%20ID=%22$$TRACKID$$%22/%3E%3C/TrackFieldRequest%3E';
	//var trackId = "9171999991703934968445";
	for (var x in USPSTRACKING)
	{
		var trackId = USPSTRACKING[x]["Tracking Number"] + "";
		if (trackId && trackId.length > 0)
		{
			var thisUri = uri;
			thisUri = thisUri.replace("$$TRACKID$$", trackId);
			thisUri = thisUri.replace("$$USERID$$", userId);
			var restHeaders = aa.util.newHashMap();
			var requestBody = "";

			restHeaders.put("Content-Type", "application/x-www-form-urlencoded");
			restHeaders.put("Method", "POST");

			var r = aa.httpClient.post(thisUri, restHeaders, requestBody);
			if (r.getSuccess())
			{
				var xml = r.getOutput();
				logDebug(capIDString +": Successfully retrieved tracking info for " + trackId);
				//logDebug(capIDString + ": raw tracking info " + xml);
				var summNode = getNode(xml, "TrackSummary");
				var status = getNode(xml, "Status");
				var statusDesc = getNode(xml, "StatusSummary");
				var statusDate = getNode(summNode, "EventDate");
				var statusTime = getNode(summNode, "EventTime");
				var shipDateTime = getNode(xml, "MPDATE");
				var toCity = getNode(xml, "DestinationCity");
				var toState = getNode(xml, "DestinationState");
				var toZip = getNode(xml, "DestinationZip");
				var address = toCity + ", " + toState + ", " + toZip;

				USPSTRACKING[x]["Status"] = status;
				USPSTRACKING[x]["Status Date"] = statusDate;
				USPSTRACKING[x]["Status Time"] = statusTime;
				USPSTRACKING[x]["Ship Date/Time"] = shipDateTime;
				USPSTRACKING[x]["Status Description"] = statusDesc;
				USPSTRACKING[x]["Mailing Address"] = address;

				logDebug(capIDString + ": Successfully refreshed tracking info");

				if ("CHECKED".equals(USPSTRACKING[x]["Request POD"]))
				{
					var mpSuffix = getNode(xml, "MPSUFFIX");
					var mpDate = getNode(xml, "MPDATE");
					requestMailPoD(trackId, mpSuffix, mpDate, USPSTRACKING[x]["POD Email"] + "");
					USPSTRACKING[x]["Request POD"] = "UNCHECKED";
					USPSTRACKING[x]["POD Email"] = "";
				}
				removeASITable("USPS TRACKING");
				addASITable("USPS TRACKING", USPSTRACKING);
			}
			else
				{ logDebug(capIDString + ": Problem while trying to retrieve tracking info: " + r.getErrorMessage()); continue; }
		}
	}
}