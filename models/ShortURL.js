const mongoose = require("mongoose");

const ShortURLSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  short_url: {
    type: Number,
    required: true,
    unique: true,
    default: 1,
  },
  createdTime: {
    type: Date,
    default: Date.now(),
  },
});

ShortURLSchema.pre("save", async function (next) {
  const doc = this;
  if (doc && doc.isNew) {
    const lastRecord = await this.constructor
      .findOne({}, { short_url: 1 })
      .sort({ short_url: -1 })
      .lean()
      .exec();
    if (lastRecord) {
      doc.short_url = lastRecord.short_url + 1;
    }
  }
  next();
});

const Url = mongoose.model("ShortUrl", ShortURLSchema);

module.exports = Url;