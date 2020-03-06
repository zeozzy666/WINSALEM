if (!matches(appTypeArray[1], "Action Order"))
{
	scheduleInspection("Initial Inspection", 14, currentUserID);
}
else
{
	scheduleInspection("Initial Investigation", 1);
}