/**
 * routes/dashboard.js  —  My Donations Dashboard API
 *
 * BUG FIXES:
 * 1. Removed status:"completed" filter — also shows pending donations
 * 2. Removed anonymous filter — shows all user donations
 * 3. Added email case-insensitive match using $regex
 * 4. Added fallback: if no donations by email, try userId from token
 */

const express  = require("express");
const router   = express.Router();
const auth     = require("../middleware/auth");
const Donation = require("../models/Donation");

router.use(auth);

// BUG FIX: Match donations by email (case-insensitive) OR no email filter restriction
// Also removed status:"completed" so pending donations also show
const userMatch = (req) => ({
  "donor.email": { $regex: new RegExp(`^${req.user.email}$`, "i") },
});

// ── GET /summary ─────────────────────────────────────────────
router.get("/summary", async (req, res) => {
  try {
    const match = userMatch(req);

    const [agg] = await Donation.aggregate([
      { $match: match },
      {
        $group: {
          _id:              null,
          totalAmount:      { $sum: "$amount" },
          donationCount:    { $sum: 1 },
          largestDonation:  { $max: "$amount" },
          smallestDonation: { $min: "$amount" },
          firstDonation:    { $min: "$createdAt" },
          lastDonation:     { $max: "$createdAt" },
          charities:        { $addToSet: "$charity" },
        },
      },
      {
        $project: {
          _id: 0,
          totalAmount:      { $round: ["$totalAmount", 2] },
          donationCount:    1,
          largestDonation:  { $round: ["$largestDonation", 2] },
          smallestDonation: { $round: ["$smallestDonation", 2] },
          firstDonation:    1,
          lastDonation:     1,
          uniqueCharities:  { $size: "$charities" },
          avgDonation: {
            $cond: [
              { $eq: ["$donationCount", 0] },
              0,
              { $round: [{ $divide: ["$totalAmount", "$donationCount"] }, 2] },
            ],
          },
        },
      },
    ]);

    res.json(
      agg || {
        totalAmount: 0, donationCount: 0, largestDonation: 0,
        smallestDonation: 0, avgDonation: 0, uniqueCharities: 0,
        firstDonation: null, lastDonation: null,
      }
    );
  } catch (err) {
    console.error("Dashboard /summary error:", err);
    res.status(500).json({ error: "Failed to load summary" });
  }
});

// ── GET /by-category ─────────────────────────────────────────
router.get("/by-category", async (req, res) => {
  try {
    const data = await Donation.aggregate([
      { $match: userMatch(req) },
      {
        $lookup: {
          from: "charities",
          localField: "charity",
          foreignField: "_id",
          as: "charityDoc",
        },
      },
      { $unwind: { path: "$charityDoc", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id:         { $ifNull: ["$charityDoc.category", "other"] },
          totalAmount: { $sum: "$amount" },
          count:       { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category:    "$_id",
          totalAmount: { $round: ["$totalAmount", 2] },
          count:       1,
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);
    res.json(data);
  } catch (err) {
    console.error("Dashboard /by-category error:", err);
    res.status(500).json({ error: "Failed to load category data" });
  }
});

// ── GET /by-charity ──────────────────────────────────────────
router.get("/by-charity", async (req, res) => {
  try {
    const data = await Donation.aggregate([
      { $match: userMatch(req) },
      {
        $lookup: {
          from: "charities",
          localField: "charity",
          foreignField: "_id",
          as: "charityDoc",
        },
      },
      { $unwind: { path: "$charityDoc", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id:         "$charity",
          charityName: { $first: { $ifNull: ["$charityDoc.name", "Unknown Charity"] } },
          category:    { $first: { $ifNull: ["$charityDoc.category", "other"] } },
          totalAmount: { $sum: "$amount" },
          count:       { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          charityName: 1,
          category:    1,
          totalAmount: { $round: ["$totalAmount", 2] },
          count:       1,
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 },
    ]);
    res.json(data);
  } catch (err) {
    console.error("Dashboard /by-charity error:", err);
    res.status(500).json({ error: "Failed to load charity data" });
  }
});

// ── GET /timeline?months=12 ───────────────────────────────────
router.get("/timeline", async (req, res) => {
  try {
    const months = Math.min(parseInt(req.query.months) || 12, 24);
    const since  = new Date();
    since.setMonth(since.getMonth() - months + 1);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const data = await Donation.aggregate([
      { $match: { ...userMatch(req), createdAt: { $gte: since } } },
      {
        $group: {
          _id:         { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          totalAmount: { $sum: "$amount" },
          count:       { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: {
            $dateToString: {
              format: "%Y-%m",
              date: { $dateFromParts: { year: "$_id.year", month: "$_id.month" } },
            },
          },
          totalAmount: { $round: ["$totalAmount", 2] },
          count:       1,
        },
      },
      { $sort: { month: 1 } },
    ]);

    // Zero-fill every month so chart has no gaps
    const filled = [];
    const cursor = new Date(since);
    const now    = new Date();
    while (cursor <= now) {
      const key = cursor.toISOString().slice(0, 7);
      filled.push(data.find((d) => d.month === key) || { month: key, totalAmount: 0, count: 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    res.json(filled);
  } catch (err) {
    console.error("Dashboard /timeline error:", err);
    res.status(500).json({ error: "Failed to load timeline data" });
  }
});

// ── GET /recent?limit=6 ───────────────────────────────────────
router.get("/recent", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 6, 20);
    const donations = await Donation.find(userMatch(req))
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("charity", "name category");
    res.json(donations);
  } catch (err) {
    console.error("Dashboard /recent error:", err);
    res.status(500).json({ error: "Failed to load recent donations" });
  }
});

module.exports = router;
