function getGISInfoByObject(svc,layer,attributename, gisObject)
{
	
	var distanceType = "feet";
	var retString;
   	
	var bufferTargetResult = aa.gis.getGISType(svc,layer); // get the buffer target
	if (bufferTargetResult.getSuccess())
		{
		var buf = bufferTargetResult.getOutput();
		buf.addAttributeName(attributename);
		}
	else
		{ logDebug("**WARNING: Getting GIS Type for Buffer Target.  Reason is: " + bufferTargetResult.getErrorType() + ":" + bufferTargetResult.getErrorMessage()) ; return false }
			
	var gisObjResult = aa.gis.getCapGISObjects(capId); // get gis objects on the cap
	if (gisObjResult.getSuccess()) 	
		var fGisObj = gisObjResult.getOutput();
	else
		{ logDebug("**WARNING: Getting GIS objects for Cap.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()) ; return false }


	var bufchk = aa.gis.getBufferByRadius(gisObject, "0", distanceType, buf);

	if (bufchk.getSuccess())
		var proxArr = bufchk.getOutput();
	else
		{ logDebug("**WARNING: Retrieving Buffer Check Results.  Reason is: " + bufchk.getErrorType() + ":" + bufchk.getErrorMessage()) ; return false }	
	
	for (a2 in proxArr)
		{
		var proxObj = proxArr[a2].getGISObjects();  // if there are GIS Objects here, we're done
		for (z1 in proxObj)
			{
			var v = proxObj[z1].getAttributeValues()
			retString = v[0];
			}
		
		}
		
	return retString
}

