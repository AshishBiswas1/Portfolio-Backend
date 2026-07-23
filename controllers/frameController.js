exports.getFrames = (req, res, next) => {
  const baseUrl = process.env.FILE_GARDEN_FRAMES_URL || '';
  const totalFrames = parseInt(process.env.TOTAL_FRAMES || '240', 10);

  const frameUrls = [];
  for (let i = 1; i <= totalFrames; i++) {
    const paddedIndex = String(i).padStart(3, '0');
    if (baseUrl) {
      const cleanBase = baseUrl.replace(/\/$/, '');
      frameUrls.push(`${cleanBase}/frame_${paddedIndex}.jpg`);
    } else {
      frameUrls.push(`/framer-motion/frame_${paddedIndex}.jpg`);
    }
  }

  res.status(200).json({
    status: 'success',
    totalFrames: frameUrls.length,
    data: {
      baseUrl,
      frames: frameUrls,
    },
  });
};
