function updateGISCapInfo()
{
	var itemCap = capId;
	if (arguments.length > 0)
		itemCap = arguments[0];
	var pin = getGISInfo("WINSALEM", "Parcels", "PIN") || "";
	var infoLink = getGISInfo("WINSALEM", "Parcels", "Detailed_Property_Info_Link") || "";
	var ward = getGISInfo("WINSALEM", "GISADMIN.Code_Enforcement_Territories", "Territory") || "";
	var inspector = getGISInfo("WINSALEM", "GISADMIN.Code_Enforcement_Territories", "NCO") || "";
	var zoning = getGISInfo("WINSALEM", "Zoning", "Zoning_District") || "";

	editAppSpecific("Ward", ward, itemCap);
	editAppSpecific("PIN", pin, itemCap);
	editAppSpecific("Detailed Property Info Link", infoLink, itemCap);
	editAppSpecific("Inspector", inspector, itemCap);
	editAppSpecific("Zoning", zoning, itemCap);
}