const StatusCodeEnums = require("../../enums/StatusCodeEnum");
const CoreException = require("../../exceptions/CoreException");
const { validMongooseObjectId } = require("../../utils/validator");

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateVideoDto:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - categoryIds
 *         - enumMode
 *       properties:
 *         title:
 *           type: string
 *           default: example
 *           description: Video's title
 *         description:
 *           type: string
 *           default: example description
 *           description: Video's description
 *         categoryIds:
 *           type: array
 *           default: []
 *           description: A list of category IDs
 *         enumMode:
 *           type: string
 *           default: public
 *           description: Value of enum mode [public, private, unlisted, member, draft]
 */

class UpdateVideoDto {
  constructor(
    videoId,
    title,
    description,
    enumMode,
    categoryIds,
    videoThumbnailFile = null // Mark as optional
  ) {
    this.videoId = videoId;
    this.title = title;
    this.description = description;
    this.enumMode = enumMode;
    this.categoryIds = categoryIds;
    this.videoThumbnailFile = videoThumbnailFile;
  }

  async validate() {
    if (!this.videoId) {
      throw new CoreException(
        StatusCodeEnums.BadRequest_400,
        "Video ID is required"
      );
    }
    await validMongooseObjectId(this.videoId);
    if (!this.title) {
      throw new CoreException(
        StatusCodeEnums.BadRequest_400,
        "Title is required"
      );
    }
    if (!this.enumMode) {
      throw new CoreException(
        StatusCodeEnums.BadRequest_400,
        "Enum mode is required"
      );
    }
    if (
      this.enumMode &&
      !["public", "private", "unlisted", "member", "draft"].includes(
        this.enumMode
      )
    ) {
      throw new CoreException(
        StatusCodeEnums.BadRequest_400,
        "Invalid video accessibility"
      );
    }
    if (this.categoryIds && !Array.isArray(this.categoryIds)) {
      throw new CoreException(
        StatusCodeEnums.BadRequest_400,
        "Category IDs must be an array"
      );
    }
    if (this.categoryIds && this.categoryIds.length > 0) {
      this.categoryIds.forEach(async (id) => {
        if (id || id.length > 0) {
          await validMongooseObjectId(id);
        }
      });
    }
    if (!this.videoThumbnailFile) {
      throw new CoreException(
        StatusCodeEnums.BadRequest_400,
        "Video thumbnail is required"
      );
    }
  }
}

module.exports = UpdateVideoDto;
