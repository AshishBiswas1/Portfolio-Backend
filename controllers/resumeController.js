const Resume = require('../models/resumeModel');
const Objective = require('../models/objectiveModel');
const Project = require('../models/projectModel');
const Internship = require('../models/internshipModel');
const Skills = require('../models/skillsModel');
const Qualification = require('../models/qualificationModel');

const catchAsync = require('../util/catchAsync');
const AppError = require('../util/appError');
const filterObj = require('../util/filterObj');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');

const { deleteFromCloudinary } = require('../util/cloudinaryHelper');

// Helper to safely parse JSON strings or arrays
function parseJsonArray(val) {
  if (!val) return undefined;
  if (Array.isArray(val)) return val;
  try {
    return JSON.parse(val);
  } catch (err) {
    return undefined;
  }
}

// ==========================================
// 1. GET ACTIVE RESUME (COMPLIANT WITH MODEL REFERENCES & POPULATION)
// ==========================================
exports.getActiveResume = catchAsync(async (req, res, next) => {
  let activeResume = await Resume.findOne({ isActive: true })
    .populate('objective')
    .populate('projects')
    .populate('experiences')
    .populate('skills')
    .populate('qualifications');

  // If no resume document exists yet, fallback to building one
  if (!activeResume) {
    activeResume = await Resume.findOne().sort({ createdAt: -1 })
      .populate('objective')
      .populate('projects')
      .populate('experiences')
      .populate('skills')
      .populate('qualifications');
  }

  // Populate dynamic references from their respective models if null/empty
  let activeObjectiveDoc = activeResume?.objective;
  if (!activeObjectiveDoc) {
    activeObjectiveDoc = await Objective.findOne({ isActive: true }) || await Objective.findOne();
  }

  let projectsList = activeResume?.projects && activeResume.projects.length > 0
    ? activeResume.projects
    : await Project.find().sort({ views: -1, createdAt: -1 });

  let experiencesList = activeResume?.experiences && activeResume.experiences.length > 0
    ? activeResume.experiences
    : await Internship.find().sort({ views: -1, createdAt: -1 });

  let skillsList = activeResume?.skills && activeResume.skills.length > 0
    ? activeResume.skills
    : await Skills.find().sort({ proficiency: -1 });

  let qualificationsList = activeResume?.qualifications && activeResume.qualifications.length > 0
    ? activeResume.qualifications
    : await Qualification.find();

  // Determine ML-targeted summary
  const requestedAudience = req.query.audience;
  let displaySummary = activeResume?.defaultSummary || activeResume?.summary || activeObjectiveDoc?.objectiveText || "";

  if (requestedAudience && activeResume?.targetedSummaries) {
    const targetedMatch = activeResume.targetedSummaries.find(
      (s) => s.audience && s.audience.toLowerCase() === requestedAudience.toLowerCase()
    );
    if (targetedMatch) {
      displaySummary = targetedMatch.text;
    }
  }

  res.status(200).json({
    status: 'success',
    data: {
      resume: {
        _id: activeResume?._id,
        id: activeResume?._id,
        fullName: activeResume?.fullName || "Ashish Biswas",
        professionalTitle: activeResume?.professionalTitle || ["Full Stack Developer"],
        contact: activeResume?.contact || { email: activeResume?.email || "", phone: activeResume?.phone || "", location: activeResume?.location || "" },
        location: activeResume?.location || activeResume?.contact?.location || "",
        email: activeResume?.email || activeResume?.contact?.email || "",
        phone: activeResume?.phone || activeResume?.contact?.phone || "",
        github: activeResume?.github || activeResume?.socialLinks?.github || "",
        linkedin: activeResume?.linkedin || activeResume?.socialLinks?.linkedin || "",
        socialLinks: activeResume?.socialLinks || { github: activeResume?.github || "", linkedin: activeResume?.linkedin || "" },
        
        // Executive Metadata Fields
        tagline: activeResume?.tagline || "",
        headline: activeResume?.headline || "",
        preferredRole: activeResume?.preferredRole || "",
        yearsOfExperience: activeResume?.yearsOfExperience || "4+ Years",
        availabilityStatus: activeResume?.availabilityStatus || "Open for Full-time Roles",
        preferredWorkMode: activeResume?.preferredWorkMode || "Remote / Hybrid",
        website: activeResume?.website || "https://ashishbiswas.dev",
        leetcode: activeResume?.leetcode || "",
        kaggle: activeResume?.kaggle || "",
        twitter: activeResume?.twitter || "",
        coreCompetencies: activeResume?.coreCompetencies || [],
        certifications: activeResume?.certifications || [],
        languages: activeResume?.languages || [],
        lastUpdatedDate: activeResume?.lastUpdatedDate || "July 2026",
        downloadCount: activeResume?.downloadCount || 0,

        // Referenced Models Output (Retrieved directly from respective models)
        objectiveDoc: activeObjectiveDoc,
        objectiveText: activeObjectiveDoc?.objectiveText || displaySummary,
        projects: projectsList,
        experiences: experiencesList,
        skills: skillsList,
        qualifications: qualificationsList,

        resumePdf: activeResume?.resumePdf || activeResume?.url || activeResume?.resumeUrl,
        url: activeResume?.url || activeResume?.resumePdf,
        resumeUrl: activeResume?.resumeUrl || activeResume?.resumePdf,
        defaultSummary: activeResume?.defaultSummary || displaySummary,
        summary: displaySummary,
        targetedSummaries: activeResume?.targetedSummaries || [],
        isActive: activeResume?.isActive ?? true
      }
    }
  });
});

// ==========================================
// 2. ADMIN CRUD OPERATIONS
// ==========================================
exports.createResume = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(
    req.body,
    'fullName',
    'professionalTitle',
    'contact.email',
    'contact.phone',
    'contact.location',
    'socialLinks.github',
    'socialLinks.linkedin',
    'location',
    'email',
    'phone',
    'github',
    'linkedin',
    'summary',
    'url',
    'resumeUrl',
    'defaultSummary',
    'isActive',
    'tagline',
    'headline',
    'preferredRole',
    'yearsOfExperience',
    'availabilityStatus',
    'preferredWorkMode',
    'website',
    'leetcode',
    'kaggle',
    'twitter',
    'lastUpdatedDate',
    'downloadCount',
    'objective'
  );

  // Parse arrays if sent as JSON strings
  if (req.body.targetedSummaries) filteredBody.targetedSummaries = parseJsonArray(req.body.targetedSummaries) || [];
  if (req.body.coreCompetencies) filteredBody.coreCompetencies = parseJsonArray(req.body.coreCompetencies) || req.body.coreCompetencies;
  if (req.body.certifications) filteredBody.certifications = parseJsonArray(req.body.certifications) || req.body.certifications;
  if (req.body.languages) filteredBody.languages = parseJsonArray(req.body.languages) || req.body.languages;
  if (req.body.projects) filteredBody.projects = parseJsonArray(req.body.projects) || req.body.projects;
  if (req.body.experiences) filteredBody.experiences = parseJsonArray(req.body.experiences) || req.body.experiences;
  if (req.body.skills) filteredBody.skills = parseJsonArray(req.body.skills) || req.body.skills;
  if (req.body.qualifications) filteredBody.qualifications = parseJsonArray(req.body.qualifications) || req.body.qualifications;

  const newResumeId = new mongoose.Types.ObjectId();
  filteredBody._id = newResumeId;

  if (req.file) {
    const uploadStream = new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'portfolio_files',
          public_id: `resume_${newResumeId}`,
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) return reject(new AppError('Failed to upload PDF', 500));
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });
    const cloudinaryResult = await uploadStream;
    filteredBody.resumePdf = cloudinaryResult.secure_url;
  }

  const newResume = await Resume.create(filteredBody);

  res.status(201).json({
    status: 'success',
    data: { resume: newResume }
  });
});

exports.updateResume = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(
    req.body,
    'fullName',
    'professionalTitle',
    'contact.email',
    'contact.phone',
    'contact.location',
    'socialLinks.github',
    'socialLinks.linkedin',
    'location',
    'email',
    'phone',
    'github',
    'linkedin',
    'summary',
    'url',
    'resumeUrl',
    'defaultSummary',
    'isActive',
    'tagline',
    'headline',
    'preferredRole',
    'yearsOfExperience',
    'availabilityStatus',
    'preferredWorkMode',
    'website',
    'leetcode',
    'kaggle',
    'twitter',
    'lastUpdatedDate',
    'downloadCount',
    'objective'
  );

  // Parse arrays if sent as JSON strings
  if (req.body.coreCompetencies) filteredBody.coreCompetencies = parseJsonArray(req.body.coreCompetencies) || req.body.coreCompetencies;
  if (req.body.certifications) filteredBody.certifications = parseJsonArray(req.body.certifications) || req.body.certifications;
  if (req.body.languages) filteredBody.languages = parseJsonArray(req.body.languages) || req.body.languages;
  if (req.body.projects) filteredBody.projects = parseJsonArray(req.body.projects) || req.body.projects;
  if (req.body.experiences) filteredBody.experiences = parseJsonArray(req.body.experiences) || req.body.experiences;
  if (req.body.skills) filteredBody.skills = parseJsonArray(req.body.skills) || req.body.skills;
  if (req.body.qualifications) filteredBody.qualifications = parseJsonArray(req.body.qualifications) || req.body.qualifications;

  let resume = await Resume.findById(req.params.id);
  if (!resume) {
    // Fallback: search for active resume if ID matches or find first
    resume = await Resume.findOne({ isActive: true });
  }

  if (!resume) {
    return next(new AppError('No resume found with that ID', 404));
  }

  if (req.body.targetedSummaries) {
    const updates = parseJsonArray(req.body.targetedSummaries);
    if (updates && Array.isArray(updates)) {
      updates.forEach((updateItem) => {
        const existingSummary = resume.targetedSummaries.find(
          (subDoc) =>
            (updateItem._id && subDoc._id.toString() === updateItem._id.toString()) ||
            (updateItem.audience && subDoc.audience.toLowerCase() === updateItem.audience.toLowerCase())
        );

        if (existingSummary) {
          if (updateItem.audience) existingSummary.audience = updateItem.audience;
          if (updateItem.text) existingSummary.text = updateItem.text;
        } else {
          resume.targetedSummaries.push(updateItem);
        }
      });
    }
  }

  if (req.file) {
    if (resume && resume.resumePdf) {
      await deleteFromCloudinary(resume.resumePdf, 'raw');
      await deleteFromCloudinary(resume.resumePdf, 'image');
    }

    const uploadStream = new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'portfolio_files',
          public_id: `resume_${req.params.id}`,
          resource_type: 'auto',
          overwrite: true,
          invalidate: true
        },
        (error, result) => {
          if (error) return reject(new AppError('Failed to upload PDF', 500));
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });
    const cloudinaryResult = await uploadStream;
    resume.resumePdf = cloudinaryResult.secure_url;
  }

  resume.set(filteredBody);
  await resume.save();

  res.status(200).json({
    status: 'success',
    data: { resume }
  });
});

exports.deleteResume = catchAsync(async (req, res, next) => {
  const resume = await Resume.findByIdAndDelete(req.params.id);

  if (!resume) {
    return next(new AppError('No resume found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});
