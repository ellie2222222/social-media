const express = require("express");
const UserController = require("../controllers/UserController");
const AuthMiddleware = require("../middlewares/AuthMiddleware");
const requireRole = require("../middlewares/requireRole");
const UserEnum = require("../enums/UserEnum");
const userController = new UserController();

const route = express.Router();

route.use(AuthMiddleware);

route.post("/follow", userController.toggleFollowController);

route.post("/saveFCMToken", userController.saveFCMTokenController);

route.get("/", userController.getAllUsersController);

route.get("/getUserHaveFCMToken", userController.getUsersHaveFCMTokenController);

route.get("/:userId", userController.getUserByIdController);

route.put("/profile/:userId", userController.updateUserProfileByIdController);

route.put("/email/:userId", userController.updateUserEmailByIdController);

route.delete("/:userId", requireRole(UserEnum.ADMIN), userController.deleteUserByIdController);

module.exports = route;
