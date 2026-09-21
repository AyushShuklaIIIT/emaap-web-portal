import express from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import crypto from "node:crypto";

export const nswsRouter = express.Router();

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error("JWT_SECRET must be configured");
  return secret;
}

// 1. NSWS SSO Login Endpoint
const ssoSchema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
});

nswsRouter.post("/sso", async (req, res) => {
  const parsed = ssoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: "Invalid SSO token payload" });
  }

  try {
    // Note: In production, the token signature & issuer (SAML/OAuth) should be validated here against NSWS public keys
    
    const user = await prisma.user.findFirst({
      where: { email: parsed.data.email, registrationRole: "STAKEHOLDER" },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found. Please sync your NSWS profile via webhook first." });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, error: "Your account is inactive" });
    }

    return res.json({
      success: true,
      data: {
        token: jwt.sign(
          { sub: user.user_id, role: "BUSINESS" },
          getJwtSecret(),
          { expiresIn: "8h" }
        ),
        userId: user.user_id,
        email: user.email,
        fullName: user.fullName ?? user.name,
        role: "BUSINESS",
      }
    });
  } catch (error) {
    console.error("NSWS SSO error", error);
    return res.status(502).json({ success: false, error: "SSO authentication failed" });
  }
});

// 2. NSWS Webhook Payload Ingestion Endpoint
const webhookSchema = z.object({
  businessName: z.string(),
  email: z.string().email(),
  mobile: z.string().min(10),
  pan: z.string().optional(),
  gstin: z.string().optional(),
  stateCode: z.string(),
  district: z.string(),
  registrationNumber: z.string(),
  entityType: z.enum(["MANUFACTURER", "DEALER", "USER"]),
  geoAddress: z.string(),
});

nswsRouter.post("/webhook", async (req, res) => {
  const parsed = webhookSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: "Invalid webhook payload", details: parsed.error });
  }

  try {
    const { 
      email, mobile, businessName, stateCode, district, 
      registrationNumber, entityType, geoAddress, pan, gstin 
    } = parsed.data;

    // Mask PII according to DPDP Act
    const maskedPan = pan ? `${pan.substring(0, 2)}******${pan.substring(8)}` : null;
    const maskedGstin = gstin ? `${gstin.substring(0, 2)}**********${gstin.substring(12)}` : null;

    let state = await prisma.state.findFirst({ where: { state_code: stateCode } });
    if (!state) {
      state = await prisma.state.create({
        data: {
          state_code: stateCode,
          state_name: stateCode,
        }
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email } });
      
      if (!user) {
        user = await tx.user.create({
          data: {
            name: businessName,
            fullName: businessName,
            email,
            mobile,
            registrationRole: "STAKEHOLDER",
            passwordHash: "sso-nsws-no-password",
            jurisdiction_state: stateCode,
            jurisdiction_district: district,
            isActive: true, // Pre-verified via NSWS
            pan: maskedPan,
            gstin: maskedGstin,
            emailVerified: true,
            mobileVerified: true,
          }
        });
      }

      let businessProfile = await tx.businessProfile.findUnique({
        where: { registration_number: registrationNumber }
      });

      if (!businessProfile) {
        businessProfile = await tx.businessProfile.create({
          data: {
            registration_number: registrationNumber,
            trade_name: businessName,
            entity_type: entityType,
            geo_address: geoAddress,
            state_id: state!.state_id,
            user_id: user.user_id,
          }
        });
      }

      return { user, businessProfile };
    });

    return res.status(201).json({
      success: true,
      message: "NSWS application record synced successfully",
      data: {
        userId: result.user.user_id,
        businessId: result.businessProfile.business_id,
      }
    });
  } catch (error) {
    console.error("NSWS Webhook error", error);
    return res.status(502).json({ success: false, error: "Failed to process NSWS webhook" });
  }
});
