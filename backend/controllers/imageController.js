const Image = require("../models/Image");

// ✅ Create Image
exports.addImage = async (req, res) => {
  try {
    const { imageUrl, adminId } = req.body;

    if (!imageUrl || !adminId) {
      return res.status(400).json({ message: "imageUrl and adminId are required" });
    }

    const newImage = new Image({ imageUrl, adminId });
    await newImage.save();

    res.status(201).json({
      message: "Image saved successfully",
      data: newImage
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ❌ Delete Image
exports.deleteImage = async (req, res) => {
  try {
    const { id } = req.params; // /api/images/:id

    const deletedImage = await Image.findByIdAndDelete(id);

    if (!deletedImage) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.status(200).json({
      message: "Image deleted successfully",
      data: deletedImage
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 📋 Get all images for an Admin
exports.getImagesByAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    const images = await Image.find({ adminId }).populate("adminId", "username email role fullName");

    res.status(200).json({
      message: "Images fetched successfully",
      count: images.length,
      data: images
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✏️ Update Image
exports.updateImage = async (req, res) => {
  try {
    const { id } = req.params; // /api/images/:id
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: "imageUrl is required" });
    }

    const updatedImage = await Image.findByIdAndUpdate(
      id,
      { imageUrl },
      { new: true } // return updated doc
    );

    if (!updatedImage) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.status(200).json({
      message: "Image updated successfully",
      data: updatedImage
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
