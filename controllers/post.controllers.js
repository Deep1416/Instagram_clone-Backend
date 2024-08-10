import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import User from "../models/user.model.js";
import Comment from "../models/comment.model.js";



export const addNewPost = async (req, res) => {
  try {
    const { caption } = req.body;
    const image = req.file;
    const authorId = req.id;

    if (!image) {
      return res.status(400).json({
        message: "Image not found",
        success: false,
      });
    }

    // Image Processing
    const optimizedImageBuffer = await sharp(image.buffer)
      .resize({ width: 800, height: 800, fit: "inside" })
      .toFormat("jpeg", { quality: 80 })
      .toBuffer();
    const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString(
      "base64"
    )}`;

    // Uploading Image to Cloudinary
    const cloudResponse = await cloudinary.uploader.upload(fileUri);
    const post = await Post.create({
      caption,
      image: cloudResponse.secure_url,
      author: authorId,
    });

    // Update User with New Post
    const user = await User.findById(authorId);
    if (user) {
      user.posts.push(post._id);
      await user.save();
    }

    // Populate the post's author details
    await post.populate({ path: "author", select: "-password" })

    return res.status(201).json({
      message: "Post created successfully",
      success: true,
      post,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "An error occurred while creating the post",
      success: false,
      error: error.message,
    });
  }
};

export const getAllPost = async (req, res) => {
  try {
    // Fetch all posts from the database, sorted by creation date in descending order
    const posts = await Post.find()
      .sort({
        createdAt: -1, // Sort posts by 'createdAt' field in descending order (-1)
      })
      .populate({
        path: "author", // Populate the 'author' field in each post
        select: "username profilePicture", // Only select the 'username' and 'profilePicture' fields of the author
      })
      .populate({
        path: "comments", // Populate the 'comments' field in each post
        sort: { createdAt: -1 }, // Sort comments by 'createdAt' field in descending order
        populate: {
          path: "author", // For each comment, populate the 'author' field
          select: "username profilePicture", // Only select the 'username' and 'profilePicture' fields of the comment author
        },
      });

    // Return a JSON response with a success message
    return res.status(200).json({
      message: "Posts retrieved successfully",
      success: true,
      posts, // Include the retrieved posts in the response
    });
  } catch (error) {
    // Log any errors that occur and return an error response
    console.log(error);
    return res.status(500).json({
      message: "An error occurred while retrieving posts",
      success: false,
    });
  }
};

export const getUserPost = async (req, res) => {
  try {
    // Retrieve the author's ID from the request object (usually set by authentication middleware)
    const authorId = req.id;

    // Fetch all posts from the database that match the author's ID
    const getPost = await Post.find({ author: authorId })
      .sort({ createdAt: -1 }) // Sort the posts by creation date in descending order
      .populate({
        path: "author", // Populate the 'author' field in each post
        select: "username, profilePicture", // Select only the 'username' and 'profilePicture' fields of the author
      })
      .populate({
        path: "comments", // Populate the 'comments' field in each post
        sort: { createdAt: -1 }, // Sort the comments by creation date in descending order
        populate: {
          path: "author", // For each comment, populate the 'author' field
          select: "username, profilePicture", // Select only the 'username' and 'profilePicture' fields of the comment author
        },
      });

    // If no posts are found for the author, return a 404 response
    if (!getPost || getPost.length === 0) {
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });
    }

    // If posts are found, return them in the response with a 200 status
    return res.status(200).json({
      message: "Post found",
      success: true,
      post: getPost,
    });
  } catch (error) {
    // If an error occurs, log it and return a 500 response with the error message
    console.error(error);
    return res.status(500).json({
      message: "An error occurred while retrieving the post",
      success: false,
      error: error.message,
    });
  }
};

export const likePost = async (req, res) => {
  try {
    // Get the user ID from the authenticated request (usually set by authentication middleware)
    const likeUserId = req.id;

    // Get the post ID from the request parameters
    const postId = req.params.id;

    // Find the post by its ID
    const post = await Post.findById(postId);

    // If the post does not exist, handle the case (though the code is incomplete here)
    if (!post) {
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });
    }

    // Like logic: Add the user ID to the likes array of the post if it doesn't already exist
    await post.updateOne({ $addToSet: { likes: likeUserId } });

    // Save the updated post (optional, since updateOne doesn't require save)
    await post.save();

    // You may want to return a success response here
    return res.status(200).json({
      message: "Post liked",
      success: true,
    });

    // Implement socket.io to notify other users about the like (not implemented here)
  } catch (error) {
    // Log any errors that occur during the process
    console.log(error);

    // Return a generic error response
    return res.status(500).json({
      message: "An error occurred while liking the post",
      success: false,
      error: error.message,
    });
  }
};

export const disLikePost = async (req, res) => {
  try {
    // Get the user ID from the authenticated request (usually set by authentication middleware)
    const likeUserId = req.id;

    // Get the post ID from the request parameters
    const postId = req.params.id;

    // Find the post by its ID
    const post = await Post.findById(postId);

    // If the post does not exist, handle the case
    if (!post) {
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });
    }

    // Dislike logic: Remove the user ID from the likes array of the post
    await post.updateOne({ $pull: { likes: likeUserId } });

    // Save the updated post (optional, since updateOne doesn't require save)
    await post.save();

    // Return a success response
    return res.status(200).json({
      message: "Post disliked",
      success: true,
    });

    // Implement socket.io to notify other users about the dislike (not implemented here)
  } catch (error) {
    // Log any errors that occur during the process
    console.log(error);

    // Return a generic error response
    return res.status(500).json({
      message: "An error occurred while disliking the post",
      success: false,
      error: error.message,
    });
  }
};

export const addComment = async (req, res) => {
  try {
    // Extracting the post ID from the request parameters
    const postId = req.params.id;

    // Extracting the user ID from the authenticated request (usually set by authentication middleware)
    const userId = req.id;

    // Extracting the comment text from the request body
    const { text } = req.body;

    // Finding the post by its ID
    const post = await Post.findById(postId);

    // Checking if the comment text is not provided
    if (!text) {
      return res.status(401).json({
        message: "Comment text is required",
        success: false,
      });
    }

    // Creating a new comment
    const comment = await Comment.create({
      text,
      author: userId,
      post: postId,
    })
    
    await comment.populate({
      path: "author",
      select: "username, profilePicture",
    });

    // Adding the comment's ID to the post's comments array
    post.comments.push(comment._id);

    // Saving the updated post
    await post.save();

    // Sending a success response
    return res.status(200).json({
      message: "Comment added successfully",
      success: true,
      comment,
    });
  } catch (error) {
    // Logging any errors that occur during the process
    console.log(error);

    // Returning a generic error response
    return res.status(500).json({
      message: "An error occurred while adding the comment",
      success: false,
      error: error.message,
    });
  }
};

export const getAllComments = async (req, res) => {
  try {
    // Extract the post ID from the request parameters
    const postId = req.params.id;

    // Find all comments related to the post by its ID
    const comment = await Comment.find({ post: postId }).populate(
      "author",
      "username profilePicture"
    );

    // If no comments are found, handle the case
    if (!comment || comment.length === 0) {
      return res.status(404).json({
        message: "No comments found for this post",
        success: false,
      });
    }

    // Return the found comments with a success message
    return res.status(200).json({
      message: "Comments retrieved successfully",
      success: true,
      comments: comment,
    });
  } catch (error) {
    // Log any errors that occur during the process
    console.log(error);

    // Return a generic error response
    return res.status(500).json({
      message: "An error occurred while retrieving the comments",
      success: false,
      error: error.message,
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    // Extract the post ID from the request parameters
    const postId = req.params.id;
    // Extract the author ID from the request (assuming it's set by authentication middleware)
    const authorId = req.id;
    // Find the post by its ID
    const post = await Post.findById(postId);

    // If the post doesn't exist, handle the case
    if (!post) {
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });
    }

    // Check if the author of the post matches the authenticated user
    if (post.author.toString() !== authorId) {
      return res.status(403).json({
        message: "Unauthorized to delete this post",
        success: false,
      });
    }

    // Delete the post by its ID
    await Post.findByIdAndDelete(postId);

    // Find the author of the post and remove the post ID from their posts array
    let user = await User.findById(authorId);
    user.posts = user.posts.filter((id) => id.toString() !== postId);
    await user.save();

    // Delete all comments associated with the post
    await Comment.deleteMany({ post: postId });

    // Return a success response after deleting the post
    return res.status(200).json({
      message: "Post deleted successfully",
      success: true,
    });
  } catch (error) {
    // Log any errors that occur during the process
    console.log(error);

    // Return a generic error response
    return res.status(500).json({
      message: "An error occurred while deleting the post",
      success: false,
      error: error.message,
    });
  }
};

export const bookmakPost = async (req, res) => {
  try {
    // Extract the post ID from the request parameters
    const postId = req.params.id;

    // Extract the author ID from the request (usually set by authentication middleware)
    const authorId = req.id;

    // Find the post by its ID
    const post = await Post.findById(postId);

    // If the post does not exist, handle the case (though the code is incomplete here)
    if (!post) {
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });
    }

    // Find the user by their ID
    const user = await User.findById(authorId);

    // Check if the post is already bookmarked by the user
    if (user.bookmarks.includes(post._id)) {
      // If it is, remove the bookmark
      await user.updateOne({ $pull: { bookmarks: post._id } });
      await user.save();

      // Return a response indicating the post was removed from bookmarks
      return res.status(200).json({
        type: "unsaved",
        message: "Post removed from bookmarks",
        success: true,
      });
    } else {
      // If it is not bookmarked, add it to the user's bookmarks
      await user.updateOne({ $addToSet: { bookmarks: post._id } });
      await user.save();

      // Return a response indicating the post was added to bookmarks
      return res.status(200).json({
        type: "saved",
        message: "Post added to bookmarks",
        success: true,
      });
    }
  } catch (error) {
    // Log any errors that occur during the process
    console.log(error);

    // Return a generic error response
    return res.status(500).json({
      message: "An error occurred while bookmarking the post",
      success: false,
      error: error.message,
    });
  }
};
