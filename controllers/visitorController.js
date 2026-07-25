const Visitor = require('../models/visitorModel');
const catchAsync = require('../util/catchAsync');

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

// 1. Log a new visitor pageview hit to MongoDB
exports.trackVisitor = catchAsync(async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || '';
  const referrer = req.body.referrer || req.headers['referrer'] || 'Direct';
  const source = detectSource(referrer, req.body.source);
  const device = detectDevice(userAgent);
  const path = req.body.path || '/';

  const newVisitor = await Visitor.create({
    ip,
    userAgent,
    path,
    referrer,
    source,
    device,
  });

  res.status(201).json({
    status: 'success',
    data: { visitor: newVisitor }
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

  // 1. Total visitors in range
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
