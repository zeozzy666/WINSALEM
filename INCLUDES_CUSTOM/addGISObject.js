function addGISObject(gisServiceName, gisLayerName, gisID) 
{
	var thisCap = null;
	if (arguments.length > 3)
		thisCap = arguments[3];
	else
		thisCap = capId;
	var retval = aa.gis.addCapGISObject(thisCap, gisServiceName, gisLayerName, gisID);
	if (retval.getSuccess()) {
		logDebug("(addGISObject) Successfully added GIS object: " + gisLayerName + " ID: " + gisID);
		return true;
	} else {
		logDebug("(addGISObject) **ERROR: Could not add GIS Object.  Reason is: " + retval.getErrorType() + ":" + retval.getErrorMessage());
		return false;
	}
}