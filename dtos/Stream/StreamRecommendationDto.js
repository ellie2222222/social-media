const StatusCodeEnums = require("../../enums/StatusCodeEnum");
const CoreException = require("../../exceptions/CoreException");
const { validMongooseObjectId } = require("../../utils/validator");

/**
 * @swagger
 * components:
 *   schemas:
 *     StreamRecommendationDto:
 *       type: object
 *       properties:
 *         categoryIds:
 *           type: array
 *           items:
 *            type: string
 *           description: The category ids.
 */

class StreamRecommendationDto {
  constructor(streamerId, categoryIds) {
    this.streamerId = streamerId;
    this.categoryIds = categoryIds;
  }

  async validate() {
    await validMongooseObjectId(this.streamerId);

    if (this.categoryIds && !Array.isArray(this.categoryIds)) {
      throw new CoreException(
        StatusCodeEnums.BadRequest_400,
        "Category IDs must be an array"
      );
    }
    if (this.categoryIds) {
      this.categoryIds.forEach(async (id) => {
        await validMongooseObjectId(id);
      });
    }
  }
}

module.exports = StreamRecommendationDto;
