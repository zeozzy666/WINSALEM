if ("Follow-Up Investagation".equals(wfTask) && "Not in Compliance".equals(wfStatus))
{
	deactivateTask("Follow-Up Investagation");
	activateTask("Legal Hearing");
}