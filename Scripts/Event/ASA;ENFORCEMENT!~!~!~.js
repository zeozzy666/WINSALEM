if (!matches(appTypeArray[1], "Action Order"))
{
	scheduleInspection("Initial Inspection", 14);
}
else
{
	scheduleInspection("Initial Investigation", 1, currentUserID);
}