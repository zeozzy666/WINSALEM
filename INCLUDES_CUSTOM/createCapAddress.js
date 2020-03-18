function createCapAddress(targetCapID, addressModel)
{
	//prevent target CAP from having more than 1 primary address
	var priAddrExists = hasPrimaryAddressInCap(targetCapID);
	if (priAddrExists)
	{
		addressModel.setPrimaryFlag("N");  
	}
				
	//Create new address for cap.	
	var createAddressResult = aa.address.createAddressWithAPOAttribute(targetCapID, addressModel);
	if(createAddressResult.getSuccess() && createAddressResult.getOutput() > 0)
	{
		logDebug("Successfully create address for cap(" + targetCapID + ")");
	}
	else
	{
		logMessage("**ERROR: Failed create address for cap(" + targetCapID + "):" + createAddressResult.getErrorMessage());
	}
}