export const requireManager = (req, res, next) => {
  if (req.userDetails.role !== "manager") {
    return res.status(403).json({
      message: "Manager access required"
    });
  }

  next();
};