const User = require("../entities/UserEntity.js");
const StatusCodeEnums = require("../enums/StatusCodeEnum.js");
const CoreException = require("../exceptions/CoreException.js");
const DatabaseTransaction = require("../repositories/DatabaseTransaction.js");
const {
  deleteCloudFlareStreamLiveInput,
} = require("./CloudFlareStreamService.js");

const getStreamService = async (streamId) => {
  try {
    const connection = new DatabaseTransaction();

    const stream = await connection.streamRepository.getStreamRepository(
      streamId
    );

    if (!stream) {
      throw new CoreException(StatusCodeEnums.NotFound_404, "Stream not found");
    }

    return stream;
  } catch (error) {
    throw error;
  }
};

const getStreamsService = async (query) => {
  const connection = new DatabaseTransaction();
  try {
    const data = await connection.streamRepository.getStreamsRepository(query);
    return data;
  } catch (error) {
    throw error;
  }
};

const updateStreamService = async (
  userId,
  streamId,
  updateData,
  categoryData
) => {
  try {
    const connection = new DatabaseTransaction();

    const stream = await connection.streamRepository.getStreamRepository(
      streamId
    );

    if (!stream) {
      throw new CoreException(StatusCodeEnums.NotFound_404, "Stream not found");
    }

    if (stream.userId.toString() !== userId) {
      throw new CoreException(
        StatusCodeEnums.Forbidden_403,
        "You do not have permission to perform this action"
      );
    }

    const updatedData =
      await connection.streamRepository.updateStreamRepository(
        streamId,
        updateData,
        categoryData
      );

    return updatedData;
  } catch (error) {
    throw error;
  }
};

const deleteStreamService = async (userId, streamId) => {
  const connection = new DatabaseTransaction();
  try {
    const session = await connection.startTransaction();

    const user = await connection.userRepository.findUserById(userId);

    if (!user) {
      throw new CoreException(StatusCodeEnums.NotFound_404, "User not found");
    }

    const stream = await connection.streamRepository.getStreamRepository(
      streamId
    );

    if (!stream) {
      throw new CoreException(StatusCodeEnums.NotFound_404, "Stream not found");
    }

    if (stream.userId.toString() !== userId) {
      throw new CoreException(
        StatusCodeEnums.Forbidden_403,
        "You do not have permission to perform this action"
      );
    }

    await connection.streamRepository.deleteStreamRepository(streamId, session);

    await deleteCloudFlareStreamLiveInput(stream.uid);

    await connection.commitTransaction();
    return stream;
  } catch (error) {
    await connection.abortTransaction();
    throw error;
  } finally {
    await connection.endSession();
  }
};


const endStreamService = async (streamId) => {
  const connection = new DatabaseTransaction();
  const session = await connection.startTransaction();

  try {
    const stream = await connection.streamRepository.endStreamRepository(
      streamId,
      session
    );

    if (!stream) {
      throw new CoreException(StatusCodeEnums.NotFound_404, "Stream not found");
    }

    await connection.commitTransaction();
    return stream;
  } catch (error) {
    await connection.abortTransaction();
    throw error;
  } finally {
    await connection.endSession();
  }
};

const createStreamService = async (data) => {
  const connection = new DatabaseTransaction();
  const session = await connection.startTransaction();

  try {
    const stream = await connection.streamRepository.createStreamRepository(
      data,
      session
    );

    await connection.commitTransaction();

    return stream;
  } catch (error) {
    await connection.abortTransaction();
    throw error;
  } finally {
    await connection.endSession();
  }
};

module.exports = {
  getStreamService,
  getStreamsService,
  endStreamService,
  updateStreamService,
  deleteStreamService,
  createStreamService,
};
