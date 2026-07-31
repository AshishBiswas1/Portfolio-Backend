const Visitor = require('../models/visitorModel');
const catchAsync = require('../util/catchAsync');
const pythonMlClient = require('../util/pythonMlClient');
const { autonomouslyPersistMLDecisionsToDB } = require('../util/autonomousMlDbUpdater');

// Helper to categorize traffic source from referrer string
function detectSource(referrer, querySource) {
  if (querySource) {
    const q = querySource.toLowerCase();
    if (q.includes('google')) return 'Google';
    if (q.includes('github')) return 'GitHub';
    if (q.includes('linkedin')) return 'LinkedIn';
    if (q.includes('twitter') || q.includes('x.com')) return 'Twitter';
    if (q.includes('direct')) return 'Direct';
  }
  if (!referrer || referrer === 'Direct') return 'Direct';
  const r = referrer.toLowerCase();
  if (r.includes('google.')) return 'Google';
  if (r.includes('github.com')) return 'GitHub';
  if (r.includes('linkedin.com')) return 'LinkedIn';
  if (r.includes('twitter.com') || r.includes('x.com')) return 'Twitter';
  return 'Other';
}

// Helper to categorize device from User-Agent
function detectDevice(userAgent) {
  if (!userAgent) return 'Desktop';
  const ua = userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'Tablet';
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    return 'Mobile';
  }
  return 'Desktop';
}

// 1. Log a new visitor pageview hit to MongoDB (ONLY if session_id is unique) & Autonomously trigger Python ML DB updates
exports.trackVisitor = catchAsync(async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || '';
  const referrer = req.body.referrer || req.headers['referrer'] || 'Direct';
  const source = detectSource(referrer, req.body.source);
  const device = detectDevice(userAgent);
  const path = req.body.path || '/';
  const sessionId = req.body.session_id || req.headers['x-session-id'] || 'sess_visitor';
  const technologies = req.body.technologies || [];
  const dwellTimeSeconds = req.body.dwell_time_seconds || 1.0;

  // Check if this session has already been recorded
  let existingVisitor = null;
  if (sessionId && sessionId !== 'sess_visitor') {
    existingVisitor = await Visitor.findOne({ sessionId });
  }

  let visitorDoc = existingVisitor;
  let isNewSession = false;

  // ONLY increment visitor count / create DB record if session is UNIQUE
  if (!existingVisitor) {
    visitorDoc = await Visitor.create({
      sessionId,
      ip,
      userAgent,
      path,
      referrer,
      source,
      device,
    });
    isNewSession = true;
  }

  // ─── AUTONOMOUS ML PERSISTENCE ───
  // Send telemetry to Python ML Microservice & autonomously update MongoDB values
  pythonMlClient.trackTelemetry(sessionId, path, technologies, dwellTimeSeconds)
    .then((mlRes) => {
      const inferredRole = mlRes?.persona?.inferred_role;
      const interestScores = mlRes?.persona?.interest_scores;
      if (inferredRole) {
        autonomouslyPersistMLDecisionsToDB(inferredRole, interestScores);
      }
    })
    .catch((err) => console.error('[Telemetry ML Sync Warning]:', err.message));

  res.status(isNewSession ? 201 : 200).json({
    status: 'success',
    isNewSession,
    data: { visitor: visitorDoc }
  });
});

// 2. Fetch aggregated visitor traffic stats & graph data from MongoDB
exports.getVisitorStats = catchAsync(async (req, res, next) => {
  const period = req.query.period || '7d';
  let daysBack = 7;
  if (period === '30d') daysBack = 30;
  if (period === '90d') daysBack = 90;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // 1. Total unique session visitors in range
  const totalVisitors = await Visitor.countDocuments({
    createdAt: { $gte: startDate }
  });

  // 2. Unique IP sessions in range (MongoDB Strict API Version 1 compatible aggregate)
  const uniqueIPs = await Visitor.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $group: { _id: '$ip' } }
  ]);
  const uniqueVisitors = uniqueIPs.length;

  // 3. Traffic sources breakdown from database
  const sourceAgg = await Visitor.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $group: { _id: '$source', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // 4. Device breakdown from database
  const deviceAgg = await Visitor.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $group: { _id: '$device', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // 5. Daily graph trends from database
  const dailyAgg = await Visitor.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        visitors: { $sum: 1 },
        ips: { $addToSet: '$ip' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const dailyTraffic = dailyAgg.map((item) => ({
    date: item._id,
    visitors: item.visitors,
    unique: item.ips ? item.ips.length : 1
  }));

  res.status(200).json({
    status: 'success',
    data: {
      period,
      totalVisitors,
      uniqueVisitors,
      dailyTraffic,
      sources: sourceAgg,
      devices: deviceAgg
    }
  });
});
