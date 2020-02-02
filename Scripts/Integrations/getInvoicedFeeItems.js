try
{
	var fromDate = aa.env.getValue("FromDate");
	var toDate = aa.env.getValue("ToDate");
	var invoicedFeeItemsArray = new Array();

	var records = getRecords(fromDate, toDate);
}
catch (err) 
{
    aa.env.setValue("returnCode", "-1"); // error
    aa.env.setValue("returnValue", err.message + " on line " + err.lineNumber);
    aa.print(err.message);
}
finally
{
	result.message = message;
    aa.env.setValue("result", result);
}

function getRecords(fDate, tDate)
{
	fDate = aa.util.formatDate(new Date(fDate), "MM/dd/YYYY");
	tDate = aa.util.formatDate(new Date(tDate), "MM/dd/YYYY");
    var sql = "SELECT B.B1_ALT_ID, O.B1_OWNER_FNAME, O.B1_OWNER_FULL_NAME, O.B1_OWNER_LNAME, O.B1_CITY, O.B1_STATE, O.B1_ZIP, I.INVOICE_DATE, F.FEEITEM_SEQ_NBR, F.GF_DES, F.GF_L1, F.GF_L2, F.GF_L3, F.GF_FEE  FROM B1PERMIT B  LEFT JOIN B3OWNERS O ON B.B1_PER_ID1 = O.B1_PER_ID1 AND B.B1_PER_ID2 = O.B1_PER_ID2 AND B.B1_PER_ID3 = O.B1_PER_ID3 AND B.SERV_PROV_CODE = O.SERV_PROV_CODE LEFT JOIN B3PARCEL P ON B.B1_PER_ID1 = P.B1_PER_ID1 AND B.B1_PER_ID2 = P.B1_PER_ID2 AND B.B1_PER_ID3 = P.B1_PER_ID3 AND B.SERV_PROV_CODE = P.SERV_PROV_CODE LEFT JOIN B3ADDRES A ON B.B1_PER_ID1 = A.B1_PER_ID1 AND B.B1_PER_ID2 = A.B1_PER_ID2 AND B.B1_PER_ID3 = A.B1_PER_ID3 AND B.SERV_PROV_CODE = A.SERV_PROV_CODE INNER JOIN  X4FEEITEM_INVOICE X ON B.B1_PER_ID1 = X.B1_PER_ID1 AND B.B1_PER_ID2 = X.B1_PER_ID2 AND B.B1_PER_ID3 = X.B1_PER_ID3 AND B.SERV_PROV_CODE = X.SERV_PROV_CODE INNER JOIN F4FEEITEM F ON B.B1_PER_ID1 = F.B1_PER_ID1 AND B.B1_PER_ID2 = F.B1_PER_ID2 AND B.B1_PER_ID3 = F.B1_PER_ID3 AND B.SERV_PROV_CODE = F.SERV_PROV_CODE AND F.GF_ITEM_STATUS_FLAG = 'INVOICED' INNER JOIN  F4INVOICE I ON I.INVOICE_NBR = X.INVOICE_NBR AND X.SERV_PROV_CODE = X.SERV_PROV_CODE WHERE B.SERV_PROV_CODE = 'WINSALEM'  AND I.INVOICE_DATE >= TO_DATE('$$fDate$$','MM-dd-YYYY') AND I.INVOICE_DATE <= TO_DATE('$$tDate$$','MM-dd-YYYY') --AND I.INVOICE_DATE >= TO_DATE('01/01/2010','MM-dd-YYYY') AND I.INVOICE_DATE <= TO_DATE('01/30/2010','MM-dd-YYYY')";
    sql = sql.replace("$$fDate$$", fDate).replace("$$tDate$$", tDate);
    aa.print(sql);
    var array = new Array();
    try {
        var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
        var ds = initialContext.lookup("java:/AA");
        var conn = ds.getConnection();        
        var sStmt = aa.db.prepareStatement(conn, sql);        
        var sStmt = conn.prepareStatement(sql);
        var rSet = sStmt.executeQuery();
       while (rSet.next()) {
            var obj = {};
            var md = rSet.getMetaData();
            var columns = md.getColumnCount();
	        for (i = 1; i <= columns; i++) {
	            obj[md.getColumnName(i)] = String(rSet.getString(md.getColumnName(i)));
	        }
	        obj.count = rSet.getRow();
	        array.push(obj)
        }

        return array;

    } catch (err) {
        aa.print(err.message);
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