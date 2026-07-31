const PYTHON_ML_URL = (process.env.PYTHON_ML_SERVICE_URL || 'http://localhost:5000').replace(/\/$/, '');

class PythonMlClient {
  async fetchPy(endpoint, body = {}, method = 'POST') {
    try {
      const response = await fetch(`${PYTHON_ML_URL}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        throw new Error(`Python ML Service error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (err) {
      console.error(`[PythonMlClient Warning] ${endpoint}:`, err.message);
      return null;
    }
  }

  /**
   * Model 1: Generates 384-dimensional dense vector embeddings
   */
  async generateEmbedding(text) {
    const res = await this.fetchPy('/ml/embeddings', { text: text || '' });
    if (res && res.embedding && Array.isArray(res.embedding)) {
      return res.embedding;
    }
    return new Array(384).fill(0);
  }

  /**
   * Model 2: Intent & Priority Prediction
   */
  async predictIntent(subject, message) {
    const res = await this.fetchPy('/ml/predict/intent', { subject: subject || '', message: message || '' });
    if (res && res.analysis) {
      return res.analysis;
    }
    return {
      intent: 'General Question',
      confidenceScore: 0.85,
      priority: 'Medium',
      sentimentScore: 0.5,
      keywords: []
    };
  }

  /**
   * Model 2: Online Learning Feedback Loop (partial_fit)
   */
  async sendFeedback(text, correctedIntent) {
    return await this.fetchPy('/ml/feedback/intent', { text: text || '', corrected_intent: correctedIntent });
  }

  /**
   * Model 2: Visitor Interaction Telemetry Tracker
   */
  async trackTelemetry(sessionId, path = '/', technologies = [], dwellTimeSeconds = 1.0) {
    return await this.fetchPy('/ml/telemetry/track', {
      session_id: sessionId,
      path,
      technologies,
      dwell_time_seconds: dwellTimeSeconds
    });
  }

  /**
   * Inter-Model Feedback Loop (Model 2 -> Model 1 Personalization)
   */
  async getPersonalizedRecommendations(targetProjectId, targetEmbedding, candidateProjects, sessionId) {
    const res = await this.fetchPy('/ml/personalized-recommendations', {
      target_project_id: targetProjectId,
      target_embedding: targetEmbedding,
      candidate_projects: candidateProjects,
      session_id: sessionId
    });

    if (res && res.recommendations && Array.isArray(res.recommendations)) {
      return res.recommendations;
    }
    return candidateProjects.slice(0, 3);
  }

  /**
   * Resume Targeted Summary Engine (Autonomous Session or Role based)
   */
  async getTargetedSummary(role, sessionId) {
    const res = await this.fetchPy('/ml/targeted-summary', { role, session_id: sessionId });
    if (res && res.data) {
      return res.data;
    }
    return {
      role: role || 'fullstack',
      targetedSummary: "Versatile Senior Full-Stack & Systems Engineer specializing in scalable web application design, backend APIs, and machine learning."
    };
  }

  /**
   * Skills Role Affinity Ranking
   */
  async rankSkills(skills, role, sessionId) {
    const res = await this.fetchPy('/ml/rank/skills', { items: skills || [], role, session_id: sessionId });
    if (res && res.skills && Array.isArray(res.skills)) {
      return res.skills;
    }
    return skills;
  }

  /**
   * Internships Role Affinity Ranking
   */
  async rankInternships(internships, role, sessionId) {
    const res = await this.fetchPy('/ml/rank/internships', { items: internships || [], role, session_id: sessionId });
    if (res && res.internships && Array.isArray(res.internships)) {
      return res.internships;
    }
    return internships;
  }
}

module.exports = new PythonMlClient();
