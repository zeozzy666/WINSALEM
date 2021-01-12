function refreshDocTrackingASIT()
{
	var itemCap = capId;
    var USPSTable = new Array();
	if (arguments.length > 0)
	{
        itemCap = arguments[0];    
		USPSTable = loadASITable("USPS TRACKING", itemCap);
		altId = itemCap.getCustomID();
    }
    else
    {
		USPSTable = USPSTRACKING;
		altId = capIDString;
    }
		
	var settings = "WINSALEM_SETTINGS_USPS"	
	var userId = lookup_noLog(settings, "USER_ID");
	var uri = lookup_noLog(settings, 'TRACK_URI');
	//For Testing
	//var userId = "645ACCEL3857";
	//var uri = 'http://production.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=%3CTrackFieldRequest%20USERID=%22$$USERID$$%22%3E%3CRevision%3E1%3C/Revision%3E%3CClientIp%3E127.0.0.1%3C/ClientIp%3E%3CSourceId%3EUSPSTOOLS%3C/SourceId%3E%3CTrackID%20ID=%22$$TRACKID$$%22/%3E%3C/TrackFieldRequest%3E';
	//var trackId = "9171999991703934968445";
	for (var x in USPSTable)
	{
		var trackId = USPSTable[x]["Tracking Number"] + "";
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
				/**** Added 12/16/2020 by MW */
				var detailArray = aa.util.getValueFromXML("TrackDetail", xml).split("</TrackDetail><TrackDetail>")
				var stringHistory = "<html><body><h3 style='color:blue';>Status History</h3>";
				for (z in detailArray) {
					aa.print(getNode(detailArray[z], "Event"))
					var detailDate = getNode(detailArray[z], "EventDate");
					var detailTime = getNode(detailArray[z], "EventTime");
					var detailEvent = getNode(detailArray[z], "Event");
					var detailCity = getNode(detailArray[z], "EventCity");
					var detailStatusCategory = getNode(detailArray[z], "EventStatusCategory");
					stringHistory += "<p style='font-size:160%;color:blue;'>" + "Date: " + detailDate + "<br>" + "Time: " + detailTime + "<br>" + "Event: " + detailEvent + "<br>" + "City: " + detailCity + "<br>" + "Status Category: " + detailStatusCategory + "</p>"
				}
				stringHistory += "</body></html>"
				//aa.print(stringHistory)
				USPSTable[x]["Status History"] = stringHistory;
				/**** Added 12/16/2020 by MW */
				USPSTable[x]["Status"] = status;
				USPSTable[x]["Status Date"] = statusDate;
				USPSTable[x]["Status Time"] = statusTime;
				USPSTable[x]["Ship Date/Time"] = shipDateTime.substring(0, shipDateTime.indexOf(".000000"));
				USPSTable[x]["Status Description"] = statusDesc;
				USPSTable[x]["Mailing Address"] = address;
				if (xml.contains("<EventCode>27</EventCode>"))
				{
					USPSTable[x]["Unclaimed"] = "CHECKED";
				}
				if (xml.contains("<EventCode>04</EventCode>"))
				{
					USPSTable[x]["Refused"] = "CHECKED";
				}

				logDebug(capIDString + ": Successfully refreshed tracking info");

				if ("CHECKED".equals(USPSTable[x]["Request POD"]))
				{
					var mpSuffix = getNode(xml, "MPSUFFIX");
					var mpDate = getNode(xml, "MPDATE");
					requestMailPoD(trackId, mpSuffix, mpDate, USPSTable[x]["POD Email"] + "");
					USPSTable[x]["Request POD"] = "UNCHECKED";
					USPSTable[x]["POD Email"] = "";
				}
				removeASITable("USPS TRACKING", itemCap);
				addASITable("USPS TRACKING", USPSTable, itemCap);
			}
			else
				{ logDebug(capIDString + ": Problem while trying to retrieve tracking info: " + r.getErrorMessage()); continue; }
		}
	}
}