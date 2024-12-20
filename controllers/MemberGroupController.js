const StatusCodeEnums = require("../enums/StatusCodeEnum");
const CoreException = require("../exceptions/CoreException");
const {
  updateVipService,
  getAllMemberGroupService,
  deleteMemberGroupService,
  getMemberGroupService,
} = require("../services/MemberGroupService");

class MemberGroupController {
  async updateMembershipController(req, res, next) {
    try {
      const { userId, ownerId, packId } = req.body;
      if (!userId || !ownerId || !packId) {
        throw new CoreException(
          StatusCodeEnums.BadRequest_400,
          "Missing fields"
        );
      }
      const result = await updateVipService(userId, ownerId, packId);
      return res
        .status(StatusCodeEnums.OK_200)
        .json({ MemberGroup: result, message: "Success" });
    } catch (error) {
      next(error);
    }
  }
  async getMemberGroupController(req, res, next) {
    const requesterId = req.userId;
    const { ownerId } = req.params;
    try {
      const result = await getMemberGroupService(ownerId, requesterId);
      if (!result) {
        throw new CoreException(
          StatusCodeEnums.NotFound_404,
          "No MemberGroup found"
        );
      }
      return res
        .status(StatusCodeEnums.OK_200)
        .json({ MemberGroup: result, message: "Success" });
    } catch (error) {
      next(error);
    }
  }
  async getAllMemberGroupController(req, res, next) {
    try {
      const result = await getAllMemberGroupService();
      if (!result) {
        throw new CoreException(
          StatusCodeEnums.NotFound_404,
          "No MemberGroup found"
        );
      }
      return res
        .status(StatusCodeEnums.OK_200)
        .json({ MemberGroup: result, message: "Success" });
    } catch (error) {
      next(error);
    }
  }
  async deleteMemberGroupController(req, res, next) {
    const requester = req.userId;
    const { ownerId } = req.params;
    try {
      const result = await deleteMemberGroupService(requester, ownerId);
      if (!result) {
        throw new CoreException(
          StatusCodeEnums.NotFound_404,
          "No MemberGroup found"
        );
      }
      return res
        .status(StatusCodeEnums.OK_200)
        .json({ MemberGroup: result, message: "Success" });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = MemberGroupController;
