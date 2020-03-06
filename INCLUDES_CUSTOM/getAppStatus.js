function getAppStatus()
{
    var itemCapId = capId;
    var capStatus = null;
    if (arguments.length == 1) itemCapId = arguments[0];

    var itemCap = aa.cap.getCap(itemCapId).getOutput();
    capStatus = itemCap.getCapStatus();

    return capStatus;
}