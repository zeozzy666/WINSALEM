if ("Follow-Up Investagation".equals(wfTask) && "Not in Compliance - New Violation".equals(wfStatus))
{
	deactivateTask("Follow-Up Investagation");
	activateTask("Legal Hearing");
}