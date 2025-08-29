const express = require("express");
const router = express.Router();
const { addImage, deleteImage, getImagesByAdmin , updateImage} = require("../controllers/imageController");

// POST /api/images -> create
router.post("/", addImage);

// DELETE /api/images/:id -> delete
router.delete("/:id", deleteImage);

// GET /api/images/admin/:adminId -> list all images for a specific admin
router.get("/admin/:adminId", getImagesByAdmin);

// PUT /api/images/:id -> update image url
router.put("/:id", updateImage);

module.exports = router;
