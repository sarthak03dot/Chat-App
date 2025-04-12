const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server, Socket } = require("socket.io");
const Message = require("./models/Message");
const Group = require("./models/Group");
const User = require("./models/User");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://localhost:3000",
  },
});

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB Connected!");
  })
  .catch((err) => {
    console.log("Error: ", err);
  });

// io.on("connection", (socket) => {
//   console.log("User Connected:", socket.id);
//   socket.on("disconnect", () => {
//     console.log("User disconnected:", socket.id);
//   });
// });

io.on("connection", (socket) => {
  socket.on("join", async ({ userId }) => {
    await User.findByIdAndUpdate(userId, { online: true });
    io.emit("userStatus", { userId, online: true });
  });

  socket.on("sendMessage", async (data) => {
    const message = new Message(data);
    await message.save();
    if (data.recipient) {
      io.to(data.recipient.toString()).emit("recieveMessage", message);
    } else if (data.group) {
      const group = await Group.findById(data.group);
      group.members.forEach((member) => {
        io.to(member.toString()).emit("receiveMessage", message);
      });
    }
  });

  socket.on("disconnect", async () => {
    const user = await User.findByIdAndUpdate(
      { online: true },
      { online: false }
    );
    if (user) io.emit("userStatus", { userId: user._id, online: false });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`App is listening on PORT:${PORT}`);
});
