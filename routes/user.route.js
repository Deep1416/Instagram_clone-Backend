import express from "express";
import {
  editProfile,
  followAndUnfollow,
  getProfile,
  getSuggestedUser,
  login,
  logout,
  register,
} from "../controllers/user.controllers.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

// Define the registration route
router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/:id/profile").get(isAuthenticated, getProfile);
router
  .route("/profile/edit")
  .post(isAuthenticated, upload.single("profilePicture"), editProfile);
router.route("/suggested").get(isAuthenticated, getSuggestedUser);
router.route("/followorunfollow/:id").post(isAuthenticated, followAndUnfollow);
export default router;
