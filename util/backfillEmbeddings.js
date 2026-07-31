const Project = require('../models/projectModel');
const pythonMlClient = require('./pythonMlClient');

async function backfillProjectEmbeddings() {
  try {
    const projects = await Project.find({
      $or: [
        { embedding: { $exists: false } },
        { embedding: { $size: 0 } }
      ]
    }).select('+embedding');

    if (projects.length === 0) {
      console.log('[ML Vector Backfill]: All projects already have 384-dim embeddings.');
      return;
    }

    console.log(`[ML Vector Backfill]: Backfilling 384-dim PyTorch vector embeddings for ${projects.length} project(s)...`);
    for (const p of projects) {
      const fullText = `${p.title || ''} ${p.shortdescription || ''} ${p.description || ''} ${(p.technologies || []).join(' ')}`;
      p.embedding = await pythonMlClient.generateEmbedding(fullText);
      p.mlLastAnalyzed = new Date();
      await p.save({ validateBeforeSave: false });
      console.log(`[ML Vector Backfill]: Generated embedding for "${p.title}"`);
    }
    console.log('[ML Vector Backfill]: Completed successfully.');
  } catch (err) {
    console.error('[ML Vector Backfill Error]:', err.message);
  }
}

module.exports = backfillProjectEmbeddings;
