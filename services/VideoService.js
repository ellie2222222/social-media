const DatabaseTransaction = require("../repositories/DatabaseTransaction");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const axios = require("axios");
const { uploadThumbnail, uploadFiles } = require("../middlewares/LoadFile");
const CoreException = require("../exceptions/CoreException");
const StatusCodeEnums = require("../enums/StatusCodeEnum");
const crypto = require("crypto");
const createVideoService = async (
  userId,
  {
    title,
    description,
    enumMode,
    categoryIds,
    bunnyId,
    videoUrl,
    videoEmbedUrl,
  }
) => {
  try {
    if (["public", "private", "unlisted"].includes(enumMode)) {
      throw new CoreException(
        StatusCodeEnums.BadRequest_400,
        "Invalid video accessibility"
      );
    }

    if (categoryIds && !Array.isArray(categoryIds)) {
      throw new CoreException(
        StatusCodeEnums.BadRequest_400,
        "CategoryIds must be an array"
      );
    }
    if (categoryIds && categoryIds.length !== 0) {
      categoryIds.forEach((id) => {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new CoreException(
            StatusCodeEnums.BadRequest_400,
            `Invalid category ID`
          );
        }
      });
    }

    const connection = new DatabaseTransaction();

    // const { videoUrl, embedUrl, thumbnailUrl } = await uploadFiles(
    //   videoFile,
    //   thumbnailFile
    // );

    const video = await connection.videoRepository.createVideoRepository({
      userId,
      title,
      description,
      categoryIds,
      enumMode,
      videoUrl,
      videoEmbedUrl,
      bunnyId,
    });

    return video;
  } catch (error) {
    throw error;
  }
};

const uploadVideoService = async (
  videoId,
  userId,
  videoFilePath,
  videoThumbnailFilePath
) => {
  try {
    const connection = new DatabaseTransaction();
    const video = await connection.videoRepository.getVideoRepository(videoId);
    if (!video) {
      throw new CoreException(StatusCodeEnums.NotFound_404, "Video not found");
    }
    if (video.userId.toString() !== userId.toString()) {
      throw new CoreException(
        StatusCodeEnums.Forbidden_403,
        "You do not have permission to perform this action"
      );
    }
    if (video.isUploaded === true) {
      throw new CoreException(
        StatusCodeEnums.BadRequest_400,
        "Video is already uploaded"
      );
    }
    video.isUploaded = true;
    video.videoServerUrl = videoFilePath;
    video.thumbnailUrl = videoThumbnailFilePath;
    await connection.videoRepository.updateAVideoByIdRepository(videoId, video);
    return video;
  } catch (error) {
    throw error;
  }
};

const generateVideoEmbedUrlToken = async (videoId, dateExpire) => {
  try {
    const connection = new DatabaseTransaction();
    const video = await connection.videoRepository.getVideoRepository(videoId);
    if (!video) {
      throw new CoreException(StatusCodeEnums.NotFound_404, "Video not found");
    }
    const input = `${process.env.BUNNY_STREAM_TOKEN_AUTHENTICATION_KEY}${video.bunnyId}${dateExpire}`;
    const hash = crypto.createHash("sha256").update(input).digest("hex");
    const url = new URL(video.videoEmbedUrl);
    url.searchParams.set("token", hash);
    url.searchParams.set("expires", dateExpire);
    await connection.videoRepository.updateAVideoByIdRepository(videoId, {
      videoEmbedUrl: url.toString(),
    });
  } catch (error) {
    throw error;
  }
};

const updateAVideoByIdService = async (videoId, data, thumbnailFile) => {
  try {
    if (
      data.enumMode &&
      !["public", "private", "unlisted"].includes(data.enumMode)
    ) {
      throw new CoreException(
        StatusCodeEnums.BadRequest_400,
        "Invalid video accessibility"
      );
    }

    const categoryIds = data.categoryIds;
    if (categoryIds && !Array.isArray(categoryIds)) {
      throw new CoreException(
        StatusCodeEnums.BadRequest_400,
        "CategoryIds must be an array"
      );
    }
    if (categoryIds && categoryIds.length !== 0) {
      categoryIds.forEach((id) => {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new CoreException(
            StatusCodeEnums.BadRequest_400,
            `Invalid category ID`
          );
        }
      });
    }

    const connection = new DatabaseTransaction();

    const video = await connection.videoRepository.getVideoRepository(videoId);
    if (!video) {
      throw new CoreException(StatusCodeEnums.NotFound_404, "Video not found");
    }

    if (thumbnailFile) {
      // const vimeoVideoId = video.videoUrl.split("/").pop();
      // const thumbnailUrl = await uploadThumbnail(
      //   `/videos/${vimeoVideoId}`,
      //   thumbnailFile
      // );
      data.thumbnailUrl = thumbnailFile.path;
    }

    const updatedVideo =
      await connection.videoRepository.updateAVideoByIdRepository(
        videoId,
        data
      );

    return updatedVideo;
  } catch (error) {
    throw error;
  }
};
const toggleLikeVideoService = async (videoId, userId, action) => {
  try {
    const connection = new DatabaseTransaction();

    const video = await connection.videoRepository.getVideoByIdRepository(
      videoId
    );

    if (!video) {
      throw new CoreException(StatusCodeEnum.NotFound_404, "Video not found");
    }

    const videoOwnerId = video.userId;

    const allowedActions = ["like", "unlike"];
    if (!allowedActions.includes(action)) {
      throw new CoreException(StatusCodeEnums.BadRequest_400, "Invalid action");
    }

    const result = await connection.videoRepository.toggleLikeVideoRepository(
      videoId,
      userId,
      action
    );

    const user = await connection.userRepository.findUserById(userId);

    const notification = {
      avatar: user.avatar,
      content: `${user.fullName} đã like video của bạn`,
      check: videoId,
      seen: false,
      createdAt: new Date(),
    };

    await connection.userRepository.notifiLikeVideoRepository(
      videoOwnerId,
      notification
    );

    return result;
  } catch (error) {
    throw error;
  }
};

const viewIncrementService = async (videoId) => {
  try {
    const connection = new DatabaseTransaction();

    const result = await connection.videoRepository.viewIncrementRepository(
      videoId
    );
    const video = await connection.videoRepository.getVideoByIdRepository(
      videoId
    );
    if (video.numOfViews % 1000 === 0) {
      const rate =
        await connection.exchangeRateRepository.getCurrentRateRepository();
      await connection.userRepository.updateUserWalletRepository(
        video.userId,
        "ReceiveCoin",
        rate.coinPer1000View
      );
    }
    return video;
  } catch (error) {
    throw error;
  }
};

const getVideosByUserIdService = async (userId, sortBy) => {
  try {
    const connection = new DatabaseTransaction();

    const videos = await connection.videoRepository.getVideosByUserIdRepository(
      userId,
      sortBy
    );

    return videos;
  } catch (error) {
    throw error;
  }
};

const getVideoService = async (videoId) => {
  try {
    const connection = new DatabaseTransaction();

    const video = await connection.videoRepository.getVideoRepository(videoId);

    return video;
  } catch (error) {
    throw error;
  }
};

const getVideosService = async (query) => {
  try {
    const connection = new DatabaseTransaction();

    const { videos, total, page, totalPages } =
      await connection.videoRepository.getAllVideosRepository(query);

    return { videos, total, page, totalPages };
  } catch (error) {
    throw error;
  }
};

const getVideosByPlaylistIdService = async (playlistId, page, size) => {
  try {
    const connection = new DatabaseTransaction();
    const videos =
      await connection.videoRepository.getVideosByPlaylistIdRepository(
        playlistId,
        page,
        size
      );
    return videos;
  } catch (error) {
    throw error;
  }
};

const deleteVideoService = async (videoId, userId) => {
  const connection = new DatabaseTransaction();

  try {
    const session = await connection.startTransaction();

    const video = await connection.videoRepository.getVideoRepository(
      videoId,
      session
    );

    if (!video || video.isDeleted === true) {
      throw new CoreException(StatusCodeEnums.NotFound_404, `Video not found`);
    }

    if (video.userId.toString() !== userId) {
      throw new CoreException(
        StatusCodeEnums.Forbidden_403,
        "You do not have permission to perform this action"
      );
    }

    // let vimeoVideoId = video.videoUrl.split("/").pop();
    // const response = await axios.delete(
    //   `https://api.vimeo.com/videos/${vimeoVideoId}`,
    //   {
    //     headers: {
    //       Authorization: `Bearer ${process.env.VIMEO_ACCESS_TOKEN}`,
    //     },
    //   }
    // );

    // if (response.status !== 204) {
    //   throw new CoreException(
    //     StatusCodeEnums.NoContent_204,
    //     "Failed to delete video on Vimeo. Video not found"
    //   );
    // }

    const result = await connection.videoRepository.deleteVideoRepository(
      video._id,
      session
    );

    if ((result.deletedCount = 0)) {
      throw new CoreException(
        StatusCodeEnums.NoContent_204,
        "Failed to delete video. Video not found"
      );
    }

    await connection.commitTransaction();

    return result;
  } catch (error) {
    await connection.abortTransaction();
    throw error;
  }
};

module.exports = {
  createVideoService,
  updateAVideoByIdService,
  createVideoService,
  updateAVideoByIdService,
  toggleLikeVideoService,
  getVideosByUserIdService,
  getVideosByPlaylistIdService,
  viewIncrementService,
  deleteVideoService,
  getVideoService,
  getVideosService,
  uploadVideoService,
  generateVideoEmbedUrlToken,
};
