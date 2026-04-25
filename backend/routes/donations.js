const express = require("express");
const router = express.Router();
const Donation = require("../models/Donation");
const Charity = require("../models/Charity");
const mongoose = require("mongoose");
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  } catch (err) {
    console.warn("Stripe not initialized:", err.message);
    stripe = null;
  }
} else {
  stripe = null;
}
const nodemailer = require("nodemailer");

// Create donation
router.post("/", async (req, res) => {
  try {
    const { charityId, amount, donor, paymentMethod, paymentToken, message } =
      req.body;

    console.log("🎯 Received donation request:", {
      charityId,
      amount,
      donorEmail: donor?.email,
      paymentMethod,
    });

    let charity = null;

    // Try to find charity by ID only if it's a valid ObjectId; otherwise skip
    if (charityId && mongoose.Types.ObjectId.isValid(charityId)) {
      charity = await Charity.findById(charityId);
    }

    // If charity not found by ID, that's OK — we'll store the charityId as-is
    // (for demo purposes with mock data)

    let paymentId;

    // Process payment based on method
    if (paymentMethod === "stripe") {
      // If Stripe is configured and we have a payment token, attempt to create a payment intent.
      // Otherwise simulate a successful payment in dev/demo mode.
      if (paymentToken && stripe) {
        const charityName = charity ? charity.name : "Unknown Charity";
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents and round
          currency: "usd",
          payment_method: paymentToken,
          confirm: true,
          description: `Donation to ${charityName}`,
          metadata: {
            charityId: charityId ? charityId.toString() : "",
            donorEmail: donor?.email || "",
          },
        });
        paymentId = paymentIntent.id;
      } else {
        // No token or Stripe not configured — simulate a successful payment
        paymentId = `DEV-${Date.now()}`;
      }
    }

    // Ensure we set a valid ObjectId for donation.charity.
    let charityRef = null;
    if (charity) {
      charityRef = charity._id;
    } else if (charityId && mongoose.Types.ObjectId.isValid(charityId)) {
      // charityId is a valid ObjectId string (even if not present in DB) — use it
      charityRef = charityId;
    } else {
      // charityId is missing or invalid (e.g. '2') — try to pick a default verified charity
      let defaultCharity = await Charity.findOne({
        verificationStatus: "verified",
      });
      if (!defaultCharity) {
        // Try to reuse an existing placeholder charity if present
        defaultCharity = await Charity.findOne({ name: "Unknown Charity" });
      }
      if (!defaultCharity) {
        // create a placeholder charity with a valid verificationStatus so donation has a valid reference
        defaultCharity = new Charity({
          name: "Unknown Charity",
          description: "Placeholder",
          verificationStatus: "pending",
        });
        await defaultCharity.save();
      }
      charityRef = defaultCharity._id;
      // ensure charity variable references the chosen charity so stats update works
      charity = defaultCharity;
    }

    // Create donation record
    const donation = new Donation({
      donor,
      charity: charityRef,
      amount,
      paymentMethod,
      paymentId,
      message,
      status: "completed",
      receiptNumber: `DON-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });

    await donation.save();
    console.log("✅ Donation saved to MongoDB:", donation._id);

    // Update charity donation stats (only if charity exists)
    if (charity) {
      charity.totalDonations += amount;
      charity.donationCount += 1;
      await charity.save();
      console.log("✅ Charity stats updated:", {
        charityId: charity._id,
        totalDonations: charity.totalDonations,
      });
    }

    // Populate charity before returning so frontend can show charity.name
    await donation.populate("charity");
    console.log("✅ Populated charity data:", donation.charity?.name);

    // Send receipt (only if donor email exists and not anonymous)
    if (donation.donor && donation.donor.email && !donation.donor.anonymous) {
      sendReceipt(donation, charity).catch((err) =>
        console.warn("⚠️ Could not send receipt email:", err.message),
      );
    }

    res.status(201).json({
      success: true,
      donation,
      receiptNumber: donation.receiptNumber,
    });
  } catch (error) {
    console.error("❌ Donation creation error:", error);
    res
      .status(500)
      .json({ error: error?.message || "Payment processing failed" });
  }
});

// Get all donations (with filters)
router.get("/", async (req, res) => {
  try {
    const { charityId, donorEmail, startDate, endDate } = req.query;
    const filter = {};

    if (charityId) filter.charity = charityId;
    if (donorEmail) filter["donor.email"] = donorEmail;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    console.log("📋 Fetching donations with filter:", filter);

    const donations = await Donation.find(filter)
      .populate("charity")
      .sort({ createdAt: -1 });

    console.log("✅ Found", donations.length, "donations");
    res.json(donations);
  } catch (error) {
    console.error("❌ Error fetching donations:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get donation by ID
router.get("/:id", async (req, res) => {
  try {
    console.log("🔍 Fetching donation by ID:", req.params.id);

    const donation = await Donation.findById(req.params.id).populate("charity");
    if (!donation) {
      console.warn("⚠️ Donation not found:", req.params.id);
      return res.status(404).json({ error: "Donation not found" });
    }

    console.log("✅ Found donation:", donation._id);
    res.json(donation);
  } catch (error) {
    console.error("❌ Error fetching donation:", error);
    res.status(500).json({ error: error.message });
  }
});

// Send receipt email
async function sendReceipt(donation, charity) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Donation Platform" <${process.env.EMAIL_USER}>`,
      to: donation.donor.email,
      subject: `Donation Receipt - ${donation.receiptNumber}`,
      html: `
        <h1>Thank You for Your Donation!</h1>
        <p>Dear ${donation.donor.name},</p>
        <p>Thank you for your generous donation to ${charity.name}.</p>
        <div style="background: #f8f9fa; padding: 20px; margin: 20px 0;">
          <h3>Donation Details:</h3>
          <p><strong>Receipt Number:</strong> ${donation.receiptNumber}</p>
          <p><strong>Amount:</strong> $${donation.amount} ${donation.currency}</p>
          <p><strong>Date:</strong> ${donation.createdAt.toLocaleDateString()}</p>
          <p><strong>Charity:</strong> ${charity.name}</p>
          <p><strong>Payment Method:</strong> ${donation.paymentMethod}</p>
        </div>
        <p>This receipt may be used for tax purposes.</p>
        <p>Thank you for making a difference!</p>
        <p>Sincerely,<br>The Donation Platform Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    donation.receiptSent = true;
    await donation.save();
  } catch (error) {
    console.error("Error sending receipt:", error);
  }
}

module.exports = router;
