var pcapId = getParent();
if (pcapId && isBlank(inspInspector))
{
    var pInspUser = getAssignedUser(pcapId);
    if (pInspUser)
        assignInspection(inspId, pInspUser);
}