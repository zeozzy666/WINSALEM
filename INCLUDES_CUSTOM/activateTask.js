function activateTask(wfstr) // optional process name
{
    var useProcess = false;
    var itemCap = capId;
	var processName = "";
	if (arguments.length > 1 && arguments[1]) {
		processName = arguments[1]; // subprocess
		useProcess = true;
	}
    if (arguments.length > 2 && arguments[2])
        itemCap = arguments[2];

	var workflowResult = aa.workflow.getTaskItems(itemCap, wfstr, processName, null, null, null);
	if (workflowResult.getSuccess())
		var wfObj = workflowResult.getOutput();
	else {
		logMessage("**ERROR: Failed to get workflow object: " + workflowResult.getErrorMessage());
		return false;
	}

	for (i in wfObj) {
		var fTask = wfObj[i];
		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();

			if (useProcess) {
				aa.workflow.adjustTask(itemCap, stepnumber, processID, "Y", "N", null, null)
			} else {
				aa.workflow.adjustTask(itemCap, stepnumber, "Y", "N", null, null)
			}
			logMessage("Activating Workflow Task: " + wfstr);
			logDebug("Activating Workflow Task: " + wfstr);
		}
	}
}
