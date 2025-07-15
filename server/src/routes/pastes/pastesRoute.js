const express = require("express");
const {
  createPastes,
  getPastes,
  patchPastes,
  getAllVersionPastes,
  getDiffVersionPastes,
} = require("../../controllers/pastes/pastesController");
const router = express.Router();

router.post("/", createPastes);
router.get("/:pasteId/:versionId", getPastes);
router.patch("/:id", patchPastes);
router.post("/versions", getAllVersionPastes);
router.get("/:id/diff/:v1/:v2", getDiffVersionPastes);

module.exports = router;
