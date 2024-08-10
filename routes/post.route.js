import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  addNewPost,
  getAllPost,
  getUserPost,
  deletePost,
  likePost,
  bookmakPost,
  disLikePost,
  addComment,
  getAllComments,
} from "../controllers/post.controllers.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.route("/addnewpost").post(isAuthenticated ,upload.single("profilePicture"), addNewPost);
router.route("/getallpost").get(isAuthenticated, getAllPost);
router.route("/getuserpost").get(isAuthenticated, getUserPost);
router.route("/deletepost/:id").delete(isAuthenticated, deletePost);
router.route("/likepost/:id").post(isAuthenticated, likePost);
router.route("/dislikepost/:id").post(isAuthenticated, disLikePost);
router.route("/bookmarkpost/:id").post(isAuthenticated, bookmakPost);
router.route("/addcomment/:id").post(isAuthenticated, addComment);
router.route("/getallcomments/:id").get(isAuthenticated, getAllComments);

export default router;
