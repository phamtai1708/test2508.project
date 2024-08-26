import express from "express";
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
await mongoose.connect(process.env.MONGODB_URL);
import bcrypt from "bcrypt";
import UserModel from "./models/user.js";
import PostModel from "./models/post.js";

const app = express();
app.use(express.json());
//--------------------------------Cau 1
app.post("/users/register", async (req, res) => {
  try {
    const { userName, email, password } = req.body;
    if (!userName) throw new Error("userName is required");
    if (!email) throw new Error("email is required");
    if (!password) throw new Error("password is required");

    const listUser = await UserModel.find({ email: email });
    console.log(listUser);
    if (listUser.length > 0) throw new Error("email da duoc su dung");

    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const passwordHash = bcrypt.hashSync(password, salt);
    const newUser = await UserModel.create({
      userId: crypto.randomUUID(),
      email: email,
      password: passwordHash,
      userName: userName,
    });
    res.status(201).send({
      message: "Thanh Cong",
      data: newUser,
    });
  } catch (error) {
    res.status(404).send({
      message: error.message,
      data: null,
    });
  }
});
//---------------Cau 2
import { apiKeyData } from "./data.js";
app.post("/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) throw new Error("email is required");
    if (!password) throw new Error("password is required");
    const listUser = await UserModel.findOne({ email: email });
    if (!listUser) throw new Error("email or password is invalid");

    const isLogin = bcrypt.compareSync(password, listUser.password);
    if (!isLogin) throw new Error("Password is invalid");
    //tạo API Key
    const randomString = crypto.randomUUID();
    const newApiKey = `mern-$${listUser.userId}$-$${listUser.email}$-$${randomString}`;

    //----Them API key vào apiKeyData
    apiKeyData[`mern-$${listUser.userId}$-$${listUser.email}$-$`] =
      randomString;
    console.log(apiKeyData);

    res.status(200).send({
      message: "Thanh Cong",
      data: listUser,
      apiKey: newApiKey,
    });
  } catch (error) {
    res.status(404).send({
      message: error.message,
      data: null,
    });
  }
});

//------------------Cau 3

app.post("/posts", async (req, res) => {
  try {
    const { apiKey } = req.query;
    if (!apiKey) throw new Error("Chưa có API key");
    let checkApiKey = false;

    //Kiểm tra API có hợp lệ không
    for (const key in apiKeyData) {
      let testString = key + apiKeyData[key];
      if (testString === apiKey) {
        checkApiKey = true;
        break;
      }
    }
    if (!checkApiKey) throw new Error("API không xác thực");
    const { userId, content } = req.body;

    if (!userId) throw new Error("userId is required");
    if (!content) throw new Error("Bạn chưa tạo bài viết");
    //Kiểm tra Api key có phù hợp với userId không
    const partOfApiKey = apiKey.split("$-$")[0].split("mern-$")[1];
    if (!(userId === partOfApiKey)) throw new Error("userId không hợp lệ");
    console.log(partOfApiKey);
    //Tạo post
    const newPost = await PostModel.create({
      postId: crypto.randomUUID(),
      userId: userId,
      content: content,
      createAt: new Date(),
      updateAt: new Date(),
    });

    res.status(200).send({
      message: "Thanh Cong",
      data: newPost,
    });
  } catch (error) {
    res.status(404).send({
      message: error.message,
      data: null,
    });
  }
});

//--------------------Câu 4
app.put("/posts/:id", async (req, res) => {
  try {
    const { apiKey } = req.query;
    if (!apiKey) throw new Error("Chưa có API key");
    let checkApiKey = false;

    //   //Kiểm tra API có hợp lệ không
    for (const key in apiKeyData) {
      let testString = key + apiKeyData[key];
      if (testString === apiKey) {
        checkApiKey = true;
        break;
      }
    }
    if (!checkApiKey) throw new Error("API không xác thực");

    //Lấy postId và kiểm tra
    const postIdToUpdate = req.params.id;
    console.log(postIdToUpdate);

    const findPost = await PostModel.findOne({ postId: postIdToUpdate });
    if (!findPost) throw new Error("Không tồn tại bài viết muốn cập nhật");

    const { content } = req.body;
    if (!content) throw new Error("Bạn chưa tạo nội dung mới");
    //Kiểm tra userId có phải người tạo ra bài viết hay không
    const partOfApiKey = apiKey.split("$-$")[0].split("mern-$")[1];
    if (!(partOfApiKey === findPost.userId))
      throw new Error("Bạn không phải người tạo ra bài viết này");

    const newPost = await PostModel.findOneAndUpdate(
      { postId: postIdToUpdate },
      {
        content: content,
        createdAt: findPost.updateAt,
        updateAt: new Date(),
      }
    );
    const postAfterUpdate = await PostModel.findOne({ postId: postIdToUpdate });
    res.status(200).send({
      message: "Thanh Cong",
      data: postAfterUpdate,
    });
  } catch (error) {
    res.status(404).send({
      message: error.message,
      data: null,
    });
  }
});

app.listen(8080, () => {
  console.log("server is running!");
});
