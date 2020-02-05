if ("In Violation".equals(inspResult))
{
	scheduleInspection("Follow-Up Investigation", 30);
	addFee("HOUS_02", "ENF_HOUS", "FINAL", 1, "Y");
}