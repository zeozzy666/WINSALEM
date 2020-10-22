function getAssignedUser() {
	var itemCap = capId;
	if (arguments.length > 0)
		itemCap = arguments[0];
	capDetail = aa.cap.getCapDetail(itemCap).getOutput();
	userObj = aa.person.getUser(capDetail.getAsgnStaff());
	if (userObj.getSuccess()){
		staff = userObj.getOutput();
		userID = staff.getUserID();
		return userID;
	}else{
		return false;
	}
}