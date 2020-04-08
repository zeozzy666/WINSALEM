function updateGISCapInfo()
{
	var itemCap = capId;
	if (arguments.length > 0)
		itemCap = arguments[0];
	var pin = getGISInfo("WINSALEM", "Parcels", "PIN") || "";
	var ward = getGISInfo("WINSALEM", "GISADMIN.Code_Enforcement_Territories", "Territory") || "";
	var inspector = getGISInfo("WINSALEM", "GISADMIN.Code_Enforcement_Territories", "NCO") || "";

	editAppSpecific("Ward", ward, itemCap);
	editAppSpecific("PIN", pin, itemCap);
	editAppSpecific("Inspector", inspector, itemCap);
}