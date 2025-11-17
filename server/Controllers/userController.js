const User = require("../Models/UserModel");
const OauthModel = require("../Models/OauthSchema");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

require("dotenv").config();

//register

exports.registerUser = async (req, res) => {
  const { username, email, country, password } = req.body;
  const lowerEmail = email.toLowerCase();

  try {
    let user = await User.findOne({ email: lowerEmail });
    if (user) return res.status(409).json({ msg: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      username,
      country,
      email: lowerEmail,
      password: hashedPassword,
    });

    await user.save();

    res.status(200).json({ response: "success" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

//Login

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  const lowerEmail = email.toLowerCase();

  try {
    const user = await User.findOne({ email: lowerEmail });
    if (!user) return res.status(404).json({ msg: "User Not Found!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: "Invalid credentials" });

    const payload = { user: { id: user.id } };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ Token: token, Plan: user.plan });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Get current user (protected)
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ msg: 'Unauthorized' });

    const user = await User.findById(userId).select('-password -__v');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    res.json({ user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};


