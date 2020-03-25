function updateGISCapInfo()
{
	var itemCap = capId;
	if (arguments.length > 0)
		itemCap = arguments[0];
	var pin = getGISInfo("WINSALEM", "Parcels", "PIN") || "";
	var ward = getGISInfo("WINSALEM", "Wards", "Ward") || "";
	var inspector = getGISInfo("WINSALEM", "GISADMIN.CBD", "CMDB_INSP") || "";

	editAppSpecific("Ward", ward, itemCap);
	editAppSpecific("PIN", pin, itemCap);
	editAppSpecific("Inspector", inspector, itemCap);
}