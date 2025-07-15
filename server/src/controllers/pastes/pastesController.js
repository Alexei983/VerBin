const { Paste, Version } = require("../../models/models");
const jwt = require("jsonwebtoken");
const diff = require("diff");

exports.createPastes = async (req, res) => {
  const { jwt_token, content, title } = req.body;

  if (!jwt_token || !content || !title) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  let userId;
  try {
    const decoded = jwt.verify(jwt_token, process.env.JWT_SECRET_KEY);
    userId = decoded.id;
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  try {
    const newPaste = await Paste.create({
      title,
      user_id: userId,
    });

    const newVersion = await Version.create({
      paste_id: newPaste.id,
      version_number: 1,
      content,
    });

    return res.status(201).json({
      message: "Paste created successfully",
      paste: {
        id: newPaste.id,
        title: newPaste.title,
        user_id: newPaste.user_id,
        created_at: newPaste.created_at,
      },
      version: {
        id: newVersion.id,
        version_number: newVersion.version_number,
        content: newVersion.content,
        created_at: newVersion.created_at,
      },
    });
  } catch (err) {
    console.error("Create error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getPastes = async (req, res) => {
  const { pasteId, versionId } = req.params;

  try {
    const paste = await Paste.findByPk(pasteId);
    if (!paste) return res.status(404).json({ message: "Paste not found" });

    const version = await Version.findOne({
      where: {
        version_number: versionId,
        paste_id: pasteId,
      },
    });

    if (!version) {
      return res.status(404).json({ message: "Version not found" });
    }

    return res.json({
      pasteId: paste.id,
      title: paste.title,
      pasteCreatedAt: paste.created_at,
      version: {
        id: version.id,
        content: version.content,
        createdAt: version.created_at,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server error");
  }
};

exports.patchPastes = async (req, res) => {
  const { jwt_token, content } = req.body;
  const pasteId = req.params.id;

  if (!jwt_token || !content) {
    return res.status(400).json({ message: "Missing jwt_token or content" });
  }

  let userId;
  try {
    const decoded = jwt.verify(jwt_token, process.env.JWT_SECRET_KEY);
    userId = decoded.id;
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  try {
    const paste = await Paste.findByPk(pasteId);
    if (!paste) {
      return res.status(404).json({ message: "Paste not found" });
    }
    if (paste.user_id !== userId) {
      return res
        .status(403)
        .json({ message: "You are not the owner of this paste" });
    }

    const lastVersion = await Version.findOne({
      where: { paste_id: pasteId },
      order: [["version_number", "DESC"]],
    });

    const nextVersionNumber = lastVersion ? lastVersion.version_number + 1 : 1;

    const newVersion = await Version.create({
      paste_id: pasteId,
      version_number: nextVersionNumber,
      content,
    });

    return res.status(201).json({
      message: "New version created successfully",
      version: {
        id: newVersion.id,
        version_number: newVersion.version_number,
        content: newVersion.content,
        created_at: newVersion.created_at,
      },
    });
  } catch (err) {
    console.error("Patch error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getAllVersionPastes = async (req, res) => {
  const { jwt_token } = req.body;

  if (!jwt_token) {
    return res.status(400).send("No value");
  }

  let userId;
  try {
    const decoded = jwt.verify(jwt_token, process.env.JWT_SECRET_KEY);
    userId = decoded.id;
  } catch (err) {
    return res.status(401).send("Invalid token");
  }

  try {
    const pastes = await Paste.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Version,
          as: "versions",
          limit: 1,
          order: [["created_at", "DESC"]],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const formatted = pastes.map((p) => ({
      pasteId: p.id,
      title: p.title,
      createdAt: p.created_at,
      latestVersion: p.versions[0]
        ? {
            id: p.versions[0].id,
            content: p.versions[0].content,
            createdAt: p.versions[0].created_at,
          }
        : null,
    }));

    return res.json(formatted);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server error");
  }
};

exports.getDiffVersionPastes = async (req, res) => {
  const pasteId = req.params.id;
  const v1 = parseInt(req.params.v1, 10);
  const v2 = parseInt(req.params.v2, 10);

  if (isNaN(v1) || isNaN(v2)) {
    return res
      .status(400)
      .json({ message: "Version numbers must be integers" });
  }

  try {
    const paste = await Paste.findByPk(pasteId);
    if (!paste) {
      return res.status(404).json({ message: "Paste not found" });
    }

    const [version1, version2] = await Promise.all([
      Version.findOne({ where: { paste_id: pasteId, version_number: v1 } }),
      Version.findOne({ where: { paste_id: pasteId, version_number: v2 } }),
    ]);

    if (!version1 || !version2) {
      return res
        .status(404)
        .json({ message: "One or both versions not found" });
    }

    const diffResult = diff.diffLines(version1.content, version2.content);

    return res.status(200).json({
      pasteId,
      title: paste.title,
      version1: {
        number: version1.version_number,
        content: version1.content,
      },
      version2: {
        number: version2.version_number,
        content: version2.content,
      },
      diff: diffResult,
    });
  } catch (err) {
    console.error("Diff error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
