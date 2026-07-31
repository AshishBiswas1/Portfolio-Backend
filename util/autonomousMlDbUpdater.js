const Project = require('../models/projectModel');
const Skills = require('../models/skillsModel');
const Internship = require('../models/internshipModel');
const Objective = require('../models/objectiveModel');

/**
 * Comprehensive Autonomous ML Database Updater.
 * Dynamically updates ALL skills (Frontend, Backend, Database, DevOps, Tools, AI/ML, Other),
 * Projects, Internships, and Objectives in MongoDB based on visitor telemetry activities.
 */
async function autonomouslyPersistMLDecisionsToDB(inferredRole, interestScores = {}) {
  try {
    if (!inferredRole) return;

    const aimlScore = interestScores.aiml || 0;
    const backendScore = interestScores.backend || 0;
    const frontendScore = interestScores.frontend || 0;
    const fullstackScore = interestScores.fullstack || 0;

    // 1. Autonomously update ALL Projects in MongoDB
    const projects = await Project.find();
    for (const project of projects) {
      const techs = (project.technologies || []).map((t) => t.toLowerCase());
      const cat = (project.category || '').toLowerCase();
      let dynamicBoost = 5;

      if (inferredRole === 'aiml' && (cat.includes('ai') || cat.includes('ml') || techs.some((t) => ['pytorch', 'tensorflow', 'python', 'nlp', 'vector', 'onnx'].includes(t)))) {
        dynamicBoost = Math.max(12, Math.round(aimlScore * 5));
      } else if (inferredRole === 'backend' && (cat.includes('backend') || techs.some((t) => ['node', 'express', 'mongodb', 'docker', 'sql', 'api', 'microservice'].includes(t)))) {
        dynamicBoost = Math.max(10, Math.round(backendScore * 4));
      } else if (inferredRole === 'frontend' && (cat.includes('frontend') || techs.some((t) => ['react', 'next.js', 'tailwind', 'three.js', 'framer', 'css'].includes(t)))) {
        dynamicBoost = Math.max(10, Math.round(frontendScore * 4));
      } else {
        dynamicBoost = Math.max(6, Math.round(fullstackScore * 3));
      }

      const updatedScore = Math.min(100, Math.max(70, 80 + dynamicBoost));
      const roleScores = project.roleScores ? { ...project.roleScores } : { fullstack: 90, aiml: 85, backend: 88, frontend: 85 };
      
      roleScores.aiml = Math.min(100, Math.max(70, (roleScores.aiml || 85) + (inferredRole === 'aiml' ? 8 : 2)));
      roleScores.backend = Math.min(100, Math.max(70, (roleScores.backend || 88) + (inferredRole === 'backend' ? 8 : 2)));
      roleScores.frontend = Math.min(100, Math.max(70, (roleScores.frontend || 85) + (inferredRole === 'frontend' ? 8 : 2)));
      roleScores.fullstack = Math.min(100, Math.max(70, (roleScores.fullstack || 90) + 4));

      await Project.findByIdAndUpdate(project._id, {
        mlScore: updatedScore,
        roleScores,
        mlLastAnalyzed: new Date()
      });
    }

    // 2. Autonomously update ALL Skills in MongoDB (Frontend, Backend, Database, DevOps, Tools, Other)
    const skills = await Skills.find();
    for (const skill of skills) {
      const sName = (skill.name || '').toLowerCase();
      const sCat = (skill.category || '').toLowerCase();
      let currentImpact = skill.impactScore || 50;
      let categoryBoost = 0;

      // Category matching & dynamic affinity score computation
      if (sCat === 'frontend' || sName.includes('react') || sName.includes('next') || sName.includes('css') || sName.includes('tailwind')) {
        categoryBoost = inferredRole === 'frontend' ? 8 : (inferredRole === 'fullstack' ? 5 : 2);
      } else if (sCat === 'backend' || sName.includes('node') || sName.includes('express') || sName.includes('api')) {
        categoryBoost = inferredRole === 'backend' ? 8 : (inferredRole === 'fullstack' ? 6 : 2);
      } else if (sCat === 'database' || sName.includes('mongo') || sName.includes('sql') || sName.includes('redis')) {
        categoryBoost = (inferredRole === 'backend' || inferredRole === 'fullstack') ? 8 : 3;
      } else if (sCat === 'devops' || sName.includes('docker') || sName.includes('git') || sName.includes('ci/cd') || sName.includes('linux')) {
        categoryBoost = (inferredRole === 'backend' || inferredRole === 'fullstack') ? 7 : 3;
      } else if (sCat === 'tools' || sName.includes('postman') || sName.includes('vscode')) {
        categoryBoost = 4;
      } else if (sName.includes('pytorch') || sName.includes('python') || sName.includes('tensorflow') || sCat === 'other') {
        categoryBoost = inferredRole === 'aiml' ? 10 : 3;
      }

      const newImpact = Math.min(100, Math.max(50, currentImpact + categoryBoost));
      await Skills.findByIdAndUpdate(skill._id, {
        impactScore: newImpact,
        isFeatured: newImpact >= 75,
        featured: newImpact >= 75
      });
    }

    // 3. Autonomously update ALL Internships in MongoDB
    const internships = await Internship.find();
    for (const internship of internships) {
      const role = (internship.role || '').toLowerCase();
      const techs = (internship.techStack || []).map((t) => t.toLowerCase());
      let boost = 0;

      if (inferredRole === 'aiml' && (role.includes('ai') || role.includes('ml') || techs.some((t) => ['pytorch', 'python'].includes(t)))) {
        boost = 10;
      } else if (inferredRole === 'backend' && (role.includes('backend') || techs.some((t) => ['node', 'express', 'mongodb', 'docker'].includes(t)))) {
        boost = 8;
      } else if (inferredRole === 'frontend' && (role.includes('frontend') || role.includes('web') || techs.some((t) => ['react', 'next'].includes(t)))) {
        boost = 8;
      } else {
        boost = 5;
      }

      const newImpact = Math.min(100, (internship.impactScore || 50) + boost);
      await Internship.findByIdAndUpdate(internship._id, { impactScore: newImpact });
    }

    // 4. Autonomously update Career Objective in MongoDB if present
    const objectives = await Objective.find();
    if (objectives && objectives.length > 0) {
      await Objective.findByIdAndUpdate(objectives[0]._id, {
        mlActiveRole: inferredRole,
        mlLastUpdated: new Date()
      });
    }

    console.log(`[Autonomous ML DB Updater] Successfully processed all activities & updated MongoDB values for role: '${inferredRole}'`);
  } catch (err) {
    console.error('[Autonomous ML DB Updater Warning]:', err.message);
  }
}

module.exports = { autonomouslyPersistMLDecisionsToDB };
