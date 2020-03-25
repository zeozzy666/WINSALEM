var result = new Object();
var messages = new Array();
var capId = null;
var actionOrderType = "Enforcement/Action Order/NA/NA";
var currentUserID = "ADMIN";
var showDebug = false;
var debug = "";
var br = "<BR>"
var AInfo = new Array();
var useAppSpecificGroupName = false;
var enableLogging = aa.env.getValue("enableLogging");
try
{        
    eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", null, true));
    eval(getScriptText("INCLUDES_CUSTOM", null, true));  
}
catch(e1)
{
    addMessage("problem loading environment " + e1.message);
}
try
{
   var source = aa.env.getValue("Source");
   var location = aa.env.getValue("Location");
   var requestType = aa.env.getValue("RequestType");
   var requestor = aa.env.getValue("Requestor");
   var propertyState = aa.env.getValue("Property State");
   var comments = aa.env.getValue("Comments");
   var addressID = aa.env.getValue("AddressID");
   var addressObj = aa.env.getValue("AddressObj");
   var ownersObj = aa.env.getValue("OwnersObj");
   var parcelObj = aa.env.getValue("ParcelObj");   

   //validate inputs
   var isValidInput = doInputValidation();
   if (isValidInput)
   {
       //create action order
       capId = createCap(actionOrderType, "");
       addMessage("Created Action order " + capId.getCustomID());

       //update custom info
       editAppSpecific("Request Type", requestType);
       isBlank(source) ? editAppSpecific("Source of Complaint", "Unkown") : editAppSpecific("Source of Complaint", source);
       isBlank(requestor) ? editAppSpecific("Owner or Tenant", "Unkown") : editAppSpecific("Owner or Tenant", requestor);
       isBlank(propertyState) ? editAppSpecific("Vacant or Occupied", "Unkown") : editAppSpecific("Vacant or Occupied", propertyState);
       if (!isBlank(comments)) editAppSpecific("Additional Details", comments);
       if (!isBlank(location)) editAppSpecific("Location", location);
       //if AddressID is provided then get APO from GIS
       if (!isBlank(addressID))
       {

       }
       else
       {
        var newAddressModel = aa.proxyInvoker.newInstance("com.accela.aa.aamain.address.AddressModel").getOutput();
        newAddressModel.setCapID(capId);
        newAddressModel.setServiceProviderCode(aa.getServiceProviderCode());
        newAddressModel.setAuditID(currentUserID);
        newAddressModel.setPrimaryFlag("Y"); 
        newAddressModel.setStreetName(addressObj.get("StreetName"));
        newAddressModel.setHouseNumberStart(Number(addressObj.get("StreetNumber")));
        if (!isBlank(addressObj.get("StreetType")))
            newAddressModel.setAddressType(addressObj.get("StreetType"));
        if (!isBlank(addressObj.get("Suffix")))
            newAddressModel.setStreetSuffix(addressObj.get("Suffix"));
        if (!isBlank(addressObj.get("UnitType")))
            newAddressModel.setUnitType(addressObj.get("UnitType"));
        if (!isBlank(addressObj.get("UnitNumber")))
            newAddressModel.setUnitStart(addressObj.get("UnitNumber"));
        if (!isBlank(addressObj.get("City")))
            newAddressModel.setCity(addressObj.get("City"));
        if (!isBlank(addressObj.get("State")))
            newAddressModel.setState(addressObj.get("State"));
        if (!isBlank(addressObj.get("ZipCode")))
            newAddressModel.setZip(addressObj.get("ZipCode"));
        //create the cap address
        createCapAddress(capId, newAddressModel);

        //create owner
        if (!isBlank(ownersObj))
        {
          var o = aa.owner.getCapOwnerScriptModel().getOutput();
          if (!isBlank(ownersObj.get("FullName")))
            o.setOwnerFullName(ownersObj.get("FullName"));
          if (!isBlank(ownersObj.get("Email")))
            o.setEmail(ownersObj.get("Email"));            
          if (!isBlank(ownersObj.get("City")))
            o.setMailCity(ownersObj.get("City"));
          if (!isBlank(ownersObj.get("State")))
            o.setMailState(ownersObj.get("State"));
          if (!isBlank(ownersObj.get("Zip")))
            o.setMailZip(ownersObj.get("Zip"));
          if (!isBlank(ownersObj.get("AddressL1")))
            o.setMailAddress1(ownersObj.get("AddressL1"));
          if (!isBlank(ownersObj.get("AddressL2")))
            o.setMailAddress2(ownersObj.get("AddressL2"));
          o.setCapID(capId);
          o.setPrimaryOwner("Y");
          var success = aa.owner.createCapOwnerWithAPOAttribute(o);
          if (success.getSuccess())
            logInfo("Successfully created owner for " + capId.getCustomID());
          else
            addMessage("Problem when creating owner for " + capId.getCustomID() + ": " + success.getErrorMessage());          
        }
        //create parcel
        if (!isBlank(parcelObj))
        {
          var capParcel = new com.accela.aa.aamain.parcel.CapParcelModel();
          var parcelModel = new com.accela.aa.aamain.parcel.ParcelModel();
          capParcel.setCapIDModel(capId);
          if (!isBlank(parcelObj.get("ParcelNum")))
            capParcel.setParcelNo(parcelObj.get("ParcelNum"));
          if (!isBlank(parcelObj.get("Block")))
            parcelModel.setBlock(parcelObj.get("Block"));
          if (!isBlank(parcelObj.get("Lot")))
            parcelModel.setLot(parcelObj.get("Lot"));
          capParcel.setParcelModel(parcelModel);
          var createPMResult = aa.parcel.createCapParcel(capParcel);                           
          if (createPMResult.getSuccess())
            logInfo("Successfully created parcel for " + capId.getCustomID());
          else
            addMessage("Problem when creating parcel for " + capId.getCustomID() + ": " + createPMResult.getErrorMessage());
        }
       }
       //schedule initial investigation
       scheduleInspection("Initial Investigation", 1);
       //create GIS Object
       copyParcelGisObjects();
   }
}
catch (err) 
{
    aa.env.setValue("returnCode", "-1"); // error
    aa.env.setValue("returnValue", err.message + " on line " + err.lineNumber);
    addMessage(err.message);
}
finally
{
	result.messages = messages;
    //printJSON(result);
    aa.env.setValue("returnCode", "1");
    aa.env.setValue("result", result);    
}
function printJSON(object)
{
for(var key in object) {
    var value = object[key];
    aa.print("$key$: $value$".replace("$key$", key).replace("$value$", value));
}
}
function doInputValidation()
{
    var isPass = true;
    if (isBlank(requestType))
        { addMessage("RequestType is required"); isPass = false; }
    if (isBlank(addressID) && isBlank(addressObj))
        { addMessage("You have to input AddressID or AddressObj"); isPass = false; }
    if (isBlank(addressID) && !isBlank(addressObj))
    {
        if (isBlank(addressObj.get("StreetNumber")))
            { addMessage("AddressObj.StreetNumber is required"); isPass = false; }
        if (isBlank(addressObj.get("StreetName")))
            { addMessage("AddressObj.StreetName is required"); isPass = false; }
        if (!Number(addressObj.get("StreetNumber")))
            { addMessage("StreetNumber has to be numerical"); isPass = false; }
    }
    return isPass;
}
function logInfo(str)
{
  if (enableLogging == true)
    addMessage(str);
}
function addMessage(str)
{
    messages.push(str);
}
function getScriptText(vScriptName, servProvCode, useProductScripts) {
    if (!servProvCode)  servProvCode = aa.getServiceProviderCode();
    vScriptName = vScriptName.toUpperCase();    
    var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
    try {
        if (useProductScripts) {
            var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);
        } else {
            var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
        }
        return emseScript.getScriptText() + "";
    } catch (err) {
        return "";
    }
}  
/*SELECT B.B1_ALT_ID, O.B1_OWNER_FNAME, O.B1_OWNER_FULL_NAME, O.B1_OWNER_LNAME, O.B1_CITY, 
O.B1_STATE, O.B1_ZIP, I.INVOICE_DATE, F.FEEITEM_SEQ_NBR, F.GF_DES, F.GF_L1, 
F.GF_L2, F.GF_L3, F.GF_FEE  FROM B1PERMIT B  LEFT JOIN B3OWNERS O 
ON B.B1_PER_ID1 = O.B1_PER_ID1 AND B.B1_PER_ID2 = O.B1_PER_ID2 
AND B.B1_PER_ID3 = O.B1_PER_ID3 AND B.SERV_PROV_CODE = O.SERV_PROV_CODE 
LEFT JOIN B3PARCEL P ON B.B1_PER_ID1 = P.B1_PER_ID1 AND B.B1_PER_ID2 = P.B1_PER_ID2 
AND B.B1_PER_ID3 = P.B1_PER_ID3 AND B.SERV_PROV_CODE = P.SERV_PROV_CODE 
LEFT JOIN B3ADDRES A ON B.B1_PER_ID1 = A.B1_PER_ID1 AND B.B1_PER_ID2 = A.B1_PER_ID2 
AND B.B1_PER_ID3 = A.B1_PER_ID3 AND B.SERV_PROV_CODE = A.SERV_PROV_CODE 
INNER JOIN  X4FEEITEM_INVOICE X ON B.B1_PER_ID1 = X.B1_PER_ID1 
AND B.B1_PER_ID2 = X.B1_PER_ID2 AND B.B1_PER_ID3 = X.B1_PER_ID3 
AND B.SERV_PROV_CODE = X.SERV_PROV_CODE INNER JOIN F4FEEITEM F 
ON B.B1_PER_ID1 = F.B1_PER_ID1 AND B.B1_PER_ID2 = F.B1_PER_ID2 
AND B.B1_PER_ID3 = F.B1_PER_ID3 AND B.SERV_PROV_CODE = F.SERV_PROV_CODE 
AND F.GF_ITEM_STATUS_FLAG = 'INVOICED' 
INNER JOIN  F4INVOICE I ON I.INVOICE_NBR = X.INVOICE_NBR 
AND X.SERV_PROV_CODE = X.SERV_PROV_CODE WHERE B.SERV_PROV_CODE = 'WINSALEM'  
AND I.INVOICE_DATE >= TO_DATE('01/01/2020','MM-dd-YYYY') 
AND I.INVOICE_DATE <= TO_DATE('02/02/2020','MM-dd-YYYY') 
--AND I.INVOICE_DATE >= TO_DATE('01/01/2010','MM-dd-YYYY') 
AND I.INVOICE_DATE <= TO_DATE('01/30/2010','MM-dd-YYYY')
2
B1_ALT_ID
B1_OWNER_FNAME
B1_OWNER_FULL_NAME
B1_OWNER_LNAME
B1_CITY
B1_STATE
B1_ZIP
INVOICE_DATE
FEEITEM_SEQ_NBR
GF_DES
GF_L1
GF_L2
GF_L3
GF_FEE
count
WAR-20-00004
B1_ALT_ID
B1_OWNER_FNAME
B1_OWNER_FULL_NAME
B1_OWNER_LNAME
B1_CITY
B1_STATE
B1_ZIP
INVOICE_DATE
FEEITEM_SEQ_NBR
GF_DES
GF_L1
GF_L2
GF_L3
GF_FEE
count
WAR-20-00004


addressModel
---------------
equals: 
toString: 
getAttributes: null
setAttributes: 
getAddressType: null
getDistance: null
getLevelPrefix: null
getXCoordinator: undefined
setYCoordinator: 
getYCoordinator: undefined
setXCoordinator: 
setLevelPrefix: 
setValidateFlag: 
getValidateFlag: null
setDistance: 
setAddressType: 
setTemplates: 
setLocationType: 
getStreetNameEnd: null
getUnitRangeEnd: null
setUnitRangeEnd: 
getLocationType: null
setStreetNameEnd: 
setAddressId: 
getAddressLine1: null
setAddressLine1: 
getAddressLine2: null
setAddressLine2: 
getLevelNumberEnd: null
getHouseNumberAlphaStart: null
getLevelNumberStart: null
getHouseNumberStart: null
getHouseNumberEnd: null
getHouseNumberAlphaEnd: null
getRefAddressType: null
getDuplicatedAPOKeys: null
addDuplicatedAPOKey: 
getStreetNameStart: null
setStreetNameStart: 
setDisplayAddress: 
setDuplicatedAPOKeys: 
getCrossStreetNameStart: null
getHouseNumberEndTo: null
setUnitRangeStart: 
setCrossStreetNameStart: 
getHouseNumberRangeEnd: null
getYCoordinatorEnd: undefined
setHouseNumberStartTo: 
setHouseNumberStartFrom: 
setHouseNumberEndTo: 
setHouseNumberRangeEnd: 
getDisplayAddress: 
getXCoordinatorEnd: undefined
isDisplayParcelLink: 
getHouseNumberStartFrom: null
getHouseNumberStartTo: null
getHouseNumberEndFrom: null
setHouseNumberRangeStart: 
setYCoordinatorEnd: 
setRefAddressType: 
setXCoordinatorEnd: 
getHouseNumberRangeStart: null
getUnitRangeStart: null
setHouseNumberEndFrom: 
setDisplayParcelLink: 
getCrossStreetNameEnd: null
setCrossStreetNameEnd: 
setHouseNumberEnd: 
setLevelNumberStart: 
toRefAddressModel: 
getSecondaryRoadNumber: null
setHouseNumberStart: 
setHouseNumberAlphaEnd: 
setLevelNumberEnd: 
setHouseNumberAlphaStart: 
setSecondaryRoadNumber: 
getRefAddressId: null
setRefAddressId: 
getAddressId: null
getTemplates: null
setState: 
getState: null
getCountry: null
getUID: undefined
setCity: 
setZip: 
getI18NCountry: null
getI18NState: null
setCountry: 
setI18NState: 
setI18NCountry: 
getStreetSuffix: null
setUID: 
getCounty: null
getUnitStart: null
setUnitType: 
setUnitStart: 
setStreetSuffix: 
getUnitType: null
getUnitEnd: null
setCounty: 
setUnitEnd: 
setFullAddress: 
getSourceFlag: null
setNeighborhood: 
setSecondaryRoad: 
getFullAddress: null
getSecondaryRoad: null
setAddressStatus: 
getAddressStatus: null
setSourceFlag: 
setStreetPrefix: 
getNeighborhood: null
getStreetPrefix: null
getEventID: null
setEventID: 
getStreetName: null
setStreetName: 
getCountryZip: 
getStreetDirection: null
setServiceProviderCode: 
getServiceProviderCode: WINSALEM
getI18NUnitType: null
setResState: 
setResUnitType: 
getResState: null
getResUnitType: null
setI18NUnitType: 
getCountryCode: null
setCountryCode: 
setResStreetSuffixdirection: 
getResStreetDirection: null
getI18NStreetSuffix: null
getI18NStreetDirection: null
setResStreetSuffix: 
setI18NStreetSuffixdirection: 
getResStreetSuffix: null
setResCountryCode: 
getI18NStreetSuffixdirection: null
getResCountryCode: null
setI18NStreetSuffix: 
getResStreetSuffixdirection: null
setI18NStreetDirection: 
setResStreetDirection: 
setInspectionDistrictPrefix: 
setNeighberhoodPrefix: 
getAddressDescription: null
setAddressTypeFlag: 
setHouseFractionStart: 
getStreetSuffixdirection: null
getHouseFractionStart: null
getInspectionDistrictPrefix: null
getAddressTypeFlag: null
setStreetDirection: 
getHouseFractionEnd: null
setHouseFractionEnd: 
setStreetSuffixdirection: 
getInspectionDistrict: null
setInspectionDistrict: 
getNeighberhoodPrefix: null
setAddressDescription: 
getCity: null
getZip: null
getPrimaryFlag: Y
setPrimaryFlag: 
setCapID: 
getCapID: REC20-00000-0000A
getAuditDate: null
setAuditDate: 
setAuditStatus: 
getAuditID: FISHAC
setAuditID: 
getAuditStatus: null
wait: 
wait: 
wait: 
hashCode: 
getClass: class com.accela.aa.aamain.address.AddressModel
notify: 
notifyAll: 

*/