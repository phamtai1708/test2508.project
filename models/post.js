import mongoose from "mongoose";
const postSchema = new mongoose.Schema({
  postId: String,
  userId: String,
  content: String,
  createAt: Date,
  updateAt: Date,
});
const PostModel = mongoose.model("posts", postSchema);
export default PostModel;
