function fillAddressModel(objRefAddressModel) {
    var itemCap = capId;
    if (arguments.length > 1)
        itemCap = arguments[1];
    var objAddressModel = new com.accela.aa.aamain.address.AddressModel();
    if (typeof (objRefAddressModel) != "undefined" && objRefAddressModel != null) {
        objAddressModel.setInspectionDistrict(objRefAddressModel.getInspectionDistrict());
        objAddressModel.setCity(objRefAddressModel.getCity());
        objAddressModel.setZip(objRefAddressModel.getZip());
        objAddressModel.setStreetName(objRefAddressModel.getStreetName());
        objAddressModel.setStreetDirection(objRefAddressModel.getStreetDirection());
        objAddressModel.setYCoordinator(objRefAddressModel.getYCoordinator());
        objAddressModel.setXCoordinator(objRefAddressModel.getXCoordinator());
        objAddressModel.setState(objRefAddressModel.getState());
        objAddressModel.setHouseNumberStart(objRefAddressModel.getHouseNumberStart());
        objAddressModel.setStreetSuffix(objRefAddressModel.getStreetSuffix());
        objAddressModel.setPrimaryFlag(objRefAddressModel.getPrimaryFlag());
        objAddressModel.setAddressDescription(objRefAddressModel.getAddressDescription());
        objAddressModel.setFullAddress(objRefAddressModel.getFullAddress());
        objAddressModel.setAuditID(objRefAddressModel.getAuditID())
        objAddressModel.setServiceProviderCode(aa.getServiceProviderCode());
        objAddressModel.setRefAddressId(objRefAddressModel.getRefAddressId());
        objAddressModel.setCapID(itemCap);
    }

    return objAddressModel;
}