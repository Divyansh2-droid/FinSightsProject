import jwt from "jsonwebtoken";

export default function (req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };   // 👈 fix: direct id assign kar diya
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
}
