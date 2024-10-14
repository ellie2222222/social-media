const StatusCodeEnums = require("../../enums/StatusCodeEnum");
const CoreException = require("../../exceptions/CoreException");
const { validEmail, validMongooseObjectId } = require("../../utils/validator");

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateUserEmailDto:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email.
 */
class UpdateUserEmailDto {
  constructor(userId, email) {
    this.email = email;
  }
  async validate() {
    if (!this.userId) {
      throw new CoreException(
        StatusCodeEnums.BadRequest_400,
        "User ID is required"
      );
    }
    await validMongooseObjectId(this.userId);

    if (!this.email) {
      throw new CoreException(
        StatusCodeEnums.BadRequest_400,
        "Email is required"
      );
    }
    await validEmail(this.email);
  }
}

module.exports = UpdateUserEmailDto;
