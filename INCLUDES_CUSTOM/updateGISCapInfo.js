function updateGISCapInfo()
{
	var itemCap = capId;
	if (arguments.length > 0)
		itemCap = arguments[0];
	var pin = getGISInfo("WINSALEM", "Parcels", "PIN") || "";
	var ward = getGISInfo("WINSALEM", "GISADMIN.Code_Enforcement_Territories", "Territory") || "";
	var inspector = getGISInfo("WINSALEM", "GISADMIN.Code_Enforcement_Territories", "NCO") || "";
	var zoning = getGISInfo("WINSALEM", "Zoning", "Zoning_District") || "";

	editAppSpecific("Ward", ward, itemCap);
	editAppSpecific("PIN", pin, itemCap);
	editAppSpecific("Inspector", inspector, itemCap);
	editAppSpecific("Zoning", zoning, itemCap);
}