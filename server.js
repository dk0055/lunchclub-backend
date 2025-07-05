const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./models/user");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = "your-secret-key";

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.error("MongoDB Connection Failed ❌", err));

console.log("MongoDB Connected ✅");

app.post("/api/register", async (req, res) => {
  const { name, email, password, profession, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const cleanProfession = profession.trim().toLowerCase();
  const user = new User({ name, email, password: hashedPassword, profession: cleanProfession, role });
  await user.save();
  res.json({ message: "User registered successfully" });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid email" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid password" });

  if ((!user.matchedWith || user.matchedWith.length === 0) && user.role === "student") {
    const expert = await User.findOne({
      role: "expert",
      profession: user.profession,
      matchedWith: { $ne: user._id },
    });

    if (expert) {
      user.matchedWith = user.matchedWith || [];
      user.matchedWith.push(expert._id);
      expert.matchedWith = expert.matchedWith || [];
      expert.matchedWith.push(user._id);
      await user.save();
      await expert.save();
    }
  }

  const token = jwt.sign({ id: user._id }, JWT_SECRET);
  res.json({ token });
});

app.get("/api/user", async (req, res) => {
  try {
    const token = req.headers.authorization;
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).populate("matchedWith", "name email profession");
    res.json({
      name: user.name,
      email: user.email,
      profession: user.profession,
      role: user.role,
      matchedWith: user.matchedWith || []
    });
  } catch (err) {
    res.status(401).json({ message: "Unauthorized" });
  }
});

app.listen(5000, () => console.log("Server running at http://localhost:5000"));
