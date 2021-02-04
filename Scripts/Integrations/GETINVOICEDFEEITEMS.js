var invoicedFeeItemsArray = new Array();
var result = new Object();
var message = "";
var capId = null;
try
{        
    eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", null, true));
    eval(getScriptText("INCLUDES_CUSTOM", null, true));  
}
catch(e1)
{
    message += "problem loading environment " + e1.message + "\n";
}
try
{
    /*Testing////////////////////////////////
    aa.env.setValue("FromDate", "01/01/2020");
    aa.env.setValue("ToDate", "02/02/2020");
    */////////////////////////////////////////
	var fromDate = aa.env.getValue("FromDate");
	var toDate = aa.env.getValue("ToDate");

	var records = getRecords(fromDate, toDate);
    aa.print(records.length)
    for (var r in records)
    {
        var thisRecord = records[r];
        var altId = thisRecord["B1_ALT_ID"];
        capId = aa.cap.getCapID(altId).getOutput();
        var thisFeeItem = new Object();
        var thisFeeCode = thisRecord[""]

        thisFeeItem.ownerName = thisRecord["B1_OWNER_FNAME"] + " " + thisRecord["B1_OWNER_LNAME"];
        thisFeeItem.ownerStreet = ""
        thisFeeItem.ownerCity = thisRecord["B1_CITY"] ? thisRecord["B1_CITY"] : "";
        thisFeeItem.ownerState = thisRecord["B1_STATE"] ? thisRecord["B1_STATE"] : "";
        thisFeeItem.ownerZip = thisRecord["B1_ZIP"] ? thisRecord["B1_ZIP"] : "";
        thisFeeItem.dateWorkPerformed = thisRecord["INVOICE_DATE"] ? thisRecord["INVOICE_DATE"] : "";
        thisFeeItem.totalCost = thisRecord["GF_FEE"] ? thisRecord["GF_FEE"] : "";
        thisFeeItem.feeSeq = thisRecord["FEEITEM_SEQ_NBR"] ? thisRecord["FEEITEM_SEQ_NBR"] : "";
        thisFeeItem.caseCloseDate  = getCloseDate();
        thisFeeItem.Area = new String(getGISInfo("WINSALEM", "Wards", "Ward")) || "";
        thisFeeItem.Pin = new String(getGISInfo("WINSALEM", "Parcels", "PIN")) || "";
        thisFeeItem.Block = new String(getGISInfo("WINSALEM", "Parcels", "BLK")) || "";
        thisFeeItem.Lot = new String(getGISInfo("WINSALEM", "Parcels", "LOT")) || "";
        thisFeeItem.location = "";
        thisFeeItem.chargeType = "";
        thisFeeItem.chargeCode = thisRecord["GF_L1"] ? thisRecord["GF_L1"] : "";
        thisFeeItem.caseID = altId;
        invoicedFeeItemsArray.push(thisFeeItem);     
        //
    }
}
catch (err) 
{
    aa.env.setValue("returnCode", "-1"); // error
    aa.env.setValue("returnValue", err.message + " on line " + err.lineNumber);
    message += err.message + "\n";
}
finally
{
	result.message = message;
    result.invoicedFeeItemsArray = invoicedFeeItemsArray;
    //aa.env.setValue("returnCode", "1");
    //aa.env.setValue("returnValue", JSON.stringify(result));
    aa.env.setValue("result", result);
}

function getRecords(fDate, tDate)
{
	fDate = aa.util.formatDate(new Date(fDate), "MM/dd/YYYY");
	tDate = aa.util.formatDate(new Date(tDate), "MM/dd/YYYY");
    var sql = "SELECT B.B1_ALT_ID, O.B1_OWNER_FNAME, O.B1_OWNER_FULL_NAME, O.B1_OWNER_LNAME, O.B1_CITY, O.B1_STATE, O.B1_ZIP, I.INVOICE_DATE, F.FEEITEM_SEQ_NBR, F.GF_DES, F.GF_L1, F.GF_L2, F.GF_L3, F.GF_FEE  FROM dbo.B1PERMIT B  LEFT JOIN dbo.B3OWNERS O ON B.B1_PER_ID1 = O.B1_PER_ID1 AND B.B1_PER_ID2 = O.B1_PER_ID2 AND B.B1_PER_ID3 = O.B1_PER_ID3 AND B.SERV_PROV_CODE = O.SERV_PROV_CODE LEFT JOIN dbo.B3PARCEL P ON B.B1_PER_ID1 = P.B1_PER_ID1 AND B.B1_PER_ID2 = P.B1_PER_ID2 AND B.B1_PER_ID3 = P.B1_PER_ID3 AND B.SERV_PROV_CODE = P.SERV_PROV_CODE LEFT JOIN dbo.B3ADDRES A ON B.B1_PER_ID1 = A.B1_PER_ID1 AND B.B1_PER_ID2 = A.B1_PER_ID2 AND B.B1_PER_ID3 = A.B1_PER_ID3 AND B.SERV_PROV_CODE = A.SERV_PROV_CODE INNER JOIN  dbo.X4FEEITEM_INVOICE X ON B.B1_PER_ID1 = X.B1_PER_ID1 AND B.B1_PER_ID2 = X.B1_PER_ID2 AND B.B1_PER_ID3 = X.B1_PER_ID3 AND B.SERV_PROV_CODE = X.SERV_PROV_CODE INNER JOIN dbo.F4FEEITEM F ON B.B1_PER_ID1 = F.B1_PER_ID1 AND B.B1_PER_ID2 = F.B1_PER_ID2 AND B.B1_PER_ID3 = F.B1_PER_ID3 AND B.SERV_PROV_CODE = F.SERV_PROV_CODE AND F.GF_ITEM_STATUS_FLAG = 'INVOICED' INNER JOIN  dbo.F4INVOICE I ON I.INVOICE_NBR = X.INVOICE_NBR AND X.SERV_PROV_CODE = X.SERV_PROV_CODE WHERE B.SERV_PROV_CODE = 'WINSALEM'  AND I.INVOICE_DATE >= CONVERT(datetime,'$$fDate$$',101) AND I.INVOICE_DATE <= CONVERT(datetime,'$$tDate$$',101)";
    sql = sql.replace("$$fDate$$", fDate).replace("$$tDate$$", tDate);

    var array = new Array();
    try {
        var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
        var ds = initialContext.lookup("java:/WINSALEM");
        var conn = ds.getConnection();        
        var sStmt = aa.db.prepareStatement(conn, sql);        
        //var sStmt = conn.prepareStatement(sql);
        var rSet = sStmt.executeQuery();
       while (rSet.next()) {
            var obj = {};
            var md = rSet.getMetaData();
            var columns = md.getColumnCount();
	        for (i = 1; i <= columns; i++) {
	            obj[md.getColumnName(i)] = String(rSet.getString(md.getColumnName(i))) == "null" ? "" : String(rSet.getString(md.getColumnName(i)));
	        }
	        obj.count = rSet.getRow();
	        array.push(obj)
        }

        return array;

    } catch (err) {
        aa.env.setValue("returnCode", "-1"); // error
        aa.env.setValue("returnValue", err.message + " on line " + err.lineNumber);
        message += err.message + "\n";
    }    
    finally
    {   
        if (rSet)
            rSet.close();
        if (sStmt)
            sStmt.close();
        if (conn)
            conn.close();        
    }
}
function getCloseDate()
{
    return "";
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
*/
