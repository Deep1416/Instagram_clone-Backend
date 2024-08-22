import Conversation from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.id; // Get the sender's ID from the request
    const reciverId = req.params.id; // Get the receiver's ID from the URL parameters
    const { message } = req.body; // Extract the message content from the request body
    // console.log(message);
    
    // Find a conversation between the sender and receiver, if it exists
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, reciverId] },
    });

    // If the conversation doesn't exist, create a new one
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, reciverId],
      });
    }

    // Create a new message document
    const newMessage = await Message.create({
      senderId,
      reciverId,
      message,
    });

    // If the message is successfully created, add it to the conversation
    if (newMessage) {
      conversation?.message?.push(newMessage._id);
    }

    // Save the conversation and the new message
    await Promise.all([conversation.save(), newMessage.save()]);

    // Return a success response
    return res.status(200).json({
      message: "Message sent successfully",
      success: true,
      data: newMessage,
    });

    // You can implement socket.io for real-time data transfer here if needed
  } catch (error) {
    console.error(error); // Log the error for debugging

    // Return an error response with a status code and message
    return res.status(500).json({
      message: "An error occurred while sending the message",
      success: false,
      error: error.message,
    });
  }
};

export const getMessage = async (req, res) => {
  try {
    const senderId = req.id; // Get the sender's ID from the request
    const reciverId = req.params.id; // Get the receiver's ID from the URL parameters

    // Find the conversation between the sender and receiver
    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, reciverId] },
    }).populate("message"); // Assuming you want to populate messages

    // If no conversation exists, return a message indicating that
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "No conversation found between these users",
      });
    }

    // Return the conversation messages
    return res.status(200).json({
      data: conversation.message, // Assuming 'message' is the correct path to the messages
      success: true,
      message: "Messages retrieved successfully",
      
    });
  } catch (error) {
    console.error(error); // Log the error for debugging

    // Return a generic error response
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving messages",
      error: error.message,
    });
  }
};
