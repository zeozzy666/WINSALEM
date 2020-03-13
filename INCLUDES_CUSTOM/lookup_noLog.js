function lookup_noLog(stdChoice,stdValue) 
	{
	var strControl;
	var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice,stdValue);
	
   	if (bizDomScriptResult.getSuccess())
   		{
			var bizDomScriptObj = bizDomScriptResult.getOutput();
			strControl = "" + bizDomScriptObj.getDescription(); // had to do this or it bombs.  who knows why?
		}
	return strControl;
	}