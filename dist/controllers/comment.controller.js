"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComments = exports.replyComment = exports.deleteComment = exports.updateComment = exports.createComment = void 0;
const comment_models_1 = require("../models/comment.models");
const mongoose_1 = __importDefault(require("mongoose"));
const like_models_1 = require("../models/like.models");
const createComment = async (req, res) => {
    const { comment, video_id } = req.body;
    const userId = req.userId;
    if (!comment) {
        return res
            .status(400)
            .json({ success: false, message: "Missing parameter comment text" });
    }
    try {
        const newComment = new comment_models_1.CommentModel({
            user: userId,
            parent_id: null,
            video: video_id,
            comment,
        });
        await newComment.save();
        return res.json({ success: true, comment: newComment });
    }
    catch (error) {
        return res
            .status(500)
            .json({ success: false, message: "Server error occurred", error });
    }
};
exports.createComment = createComment;
const updateComment = async (req, res) => {
    const { comment } = req.body;
    const commentId = req.params.id;
    const userId = req.userId;
    if (!comment) {
        return res
            .status(400)
            .json({ success: false, message: "Missing parameter comment text" });
    }
    try {
        const existingComment = await comment_models_1.CommentModel.findById(commentId);
        if (!existingComment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found",
            });
        }
        if (existingComment.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "User unauthorized to update this comment",
            });
        }
        existingComment.comment = comment;
        await existingComment.save();
        return res.json({
            success: true,
            message: "Comment updated successfully",
            comment: existingComment,
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({ success: false, message: "Server error occurred", error });
    }
};
exports.updateComment = updateComment;
const deleteComment = async (req, res) => {
    const commentId = req.params.id;
    const userId = req.userId;
    try {
        const existingComment = await comment_models_1.CommentModel.findById(commentId);
        if (!existingComment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found",
            });
        }
        if (existingComment.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "User unauthorized to delete this comment",
            });
        }
        await comment_models_1.CommentModel.deleteOne({ _id: commentId });
        return res.json({ success: true, message: "Comment deleted successfully" });
    }
    catch (error) {
        return res
            .status(500)
            .json({ success: false, message: "Server error occurred", error });
    }
};
exports.deleteComment = deleteComment;
const replyComment = async (req, res) => {
    const { comment, parent_id } = req.body;
    const userId = req.userId;
    if (!comment || !parent_id) {
        return res.status(400).json({
            success: false,
            message: "Missing parameter comment text or parent comment ID",
        });
    }
    try {
        const parentComment = await comment_models_1.CommentModel.findById(parent_id);
        if (!parentComment) {
            return res
                .status(404)
                .json({ success: false, message: "Parent comment not found" });
        }
        const newReply = new comment_models_1.CommentModel({
            user: userId,
            parent_id: parent_id,
            video: parentComment.video,
            comment,
        });
        await newReply.save();
        return res.json({ success: true, reply: newReply });
    }
    catch (error) {
        return res
            .status(500)
            .json({ success: false, message: "Server error occurred", error });
    }
};
exports.replyComment = replyComment;
const getNestedReplies = async (parentId) => {
    const replies = await comment_models_1.CommentModel.aggregate([
        {
            $match: {
                parent_id: parentId,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user",
            },
        },
        { $unwind: "$user" },
        {
            $project: {
                _id: 1,
                comment: 1,
                user: {
                    _id: "$user._id",
                    name: "$user.name",
                    avatar: "$user.avatar",
                },
                createdAt: 1,
                updatedAt: 1,
                parent_id: 1,
            },
        },
    ]);
    const nestedReplies = await Promise.all(replies.map(async (reply) => {
        const childReplies = await getNestedReplies(reply._id);
        return {
            ...reply,
            replies: childReplies,
        };
    }));
    return nestedReplies;
};
// export const getComments = async (
//   req: CustomRequest,
//   res: Response
// ): Promise<Response> => {
//   const video_id = req.params.video_id;
//   const userId = req.userId;
//   if (!video_id) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Missing parameter videoId" });
//   }
//   try {
//     const comments = await CommentModel.aggregate([
//       {
//         $match: {
//           parent_id: null,
//           video: new mongoose.Types.ObjectId(video_id),
//         },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "user",
//           foreignField: "_id",
//           as: "user",
//         },
//       },
//       { $unwind: "$user" },
//       {
//         $project: {
//           _id: "$_id",
//           comment: 1,
//           user: {
//             _id: 1,
//             name: 1,
//             avatar: 1,
//           },
//           createdAt: 1,
//           updatedAt: 1,
//         },
//       },
//     ]);
//     const commentsWithReplies: Comment[] = await Promise.all(
//       comments.map(async (comment) => {
//         const replies = await getNestedReplies(comment._id);
//         return {
//           ...comment,
//           replies,
//         };
//       })
//     );
//     const totalComments = await CommentModel.countDocuments({
//       video: new mongoose.Types.ObjectId(video_id),
//     });
//     return res.json({
//       success: true,
//       data: commentsWithReplies.map((item) => ({
//         ...item,
//         is_owner: userId
//           ? item.user._id.toString() === userId.toString()
//           : false,
//       })),
//       totalComments,
//     });
//   } catch (error) {
//     console.log(error);
//     return res
//       .status(500)
//       .json({ success: false, message: "Server error occurred", error });
//   }
// };
const getComments = async (req, res) => {
    const video_id = req.params.video_id;
    const userId = req.userId;
    if (!video_id) {
        return res
            .status(400)
            .json({ success: false, message: "Missing parameter videoId" });
    }
    try {
        const comments = await comment_models_1.CommentModel.aggregate([
            {
                $match: {
                    parent_id: null,
                    video: new mongoose_1.default.Types.ObjectId(video_id),
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$user" },
            {
                $lookup: {
                    from: "likes", // Join with the "likes" collection to get like/dislike count
                    let: { commentId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$comment", "$$commentId"] },
                            },
                        },
                        {
                            $group: {
                                _id: "$comment",
                                likeCount: {
                                    $sum: { $cond: [{ $eq: ["$type", "like"] }, 1, 0] },
                                },
                                dislikeCount: {
                                    $sum: { $cond: [{ $eq: ["$type", "dislike"] }, 1, 0] },
                                },
                            },
                        },
                    ],
                    as: "likeDislikeCounts",
                },
            },
            {
                $unwind: {
                    path: "$likeDislikeCounts",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: "$_id",
                    comment: 1,
                    user: {
                        _id: 1,
                        name: 1,
                        avatar: 1,
                    },
                    createdAt: 1,
                    updatedAt: 1,
                    likeCount: { $ifNull: ["$likeDislikeCounts.likeCount", 0] },
                    dislikeCount: { $ifNull: ["$likeDislikeCounts.dislikeCount", 0] },
                },
            },
        ]);
        // Lấy tất cả các replies cho mỗi comment
        const commentsWithReplies = await Promise.all(comments.map(async (comment) => {
            // Lấy tất cả các replies
            const replies = await getNestedReplies(comment._id);
            // Tính toán likeCount và dislikeCount cho mỗi reply
            const repliesWithCounts = await Promise.all(replies.map(async (reply) => {
                const likeDislikeCounts = await like_models_1.LikeModel.aggregate([
                    {
                        $match: {
                            comment: new mongoose_1.default.Types.ObjectId(reply._id),
                        },
                    },
                    {
                        $group: {
                            _id: "$comment",
                            likeCount: {
                                $sum: { $cond: [{ $eq: ["$type", "like"] }, 1, 0] },
                            },
                            dislikeCount: {
                                $sum: { $cond: [{ $eq: ["$type", "dislike"] }, 1, 0] },
                            },
                        },
                    },
                ]);
                return {
                    ...reply,
                    likeCount: likeDislikeCounts[0]?.likeCount || 0,
                    dislikeCount: likeDislikeCounts[0]?.dislikeCount || 0,
                };
            }));
            return {
                ...comment,
                replies: repliesWithCounts,
            };
        }));
        const totalComments = await comment_models_1.CommentModel.countDocuments({
            video: new mongoose_1.default.Types.ObjectId(video_id),
        });
        return res.json({
            success: true,
            data: commentsWithReplies.map((item) => ({
                ...item,
                is_owner: userId
                    ? item.user._id.toString() === userId.toString()
                    : false,
            })),
            totalComments,
        });
    }
    catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ success: false, message: "Server error occurred", error });
    }
};
exports.getComments = getComments;
