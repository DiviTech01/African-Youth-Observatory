import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface DataAccessPolicy {
  role: string;
  canViewAllData: boolean;
  canViewPremiumInsights: boolean;
  canExportBulk: boolean;
  canUploadData: boolean;
  canManageUsers: boolean;
  canComputeIndex: boolean;
  canViewAdminPanel: boolean;
  maxExportRows: number;
  maxApiCallsPerMinute: number;
  ownDataOnly: boolean;
}

const POLICIES: Record<string, DataAccessPolicy> = {
  PUBLIC: {
    role: 'PUBLIC',
    canViewAllData: true,
    canViewPremiumInsights: false,
    canExportBulk: false,
    canUploadData: false,
    canManageUsers: false,
    canComputeIndex: false,
    canViewAdminPanel: false,
    maxExportRows: 100,
    maxApiCallsPerMinute: 30,
    ownDataOnly: false,
  },
  REGISTERED: {
    role: 'REGISTERED',
    canViewAllData: true,
    canViewPremiumInsights: false,
    canExportBulk: false,
    canUploadData: false,
    canManageUsers: false,
    canComputeIndex: false,
    canViewAdminPanel: false,
    maxExportRows: 1000,
    maxApiCallsPerMinute: 60,
    ownDataOnly: false,
  },
  RESEARCHER: {
    role: 'RESEARCHER',
    canViewAllData: true,
    canViewPremiumInsights: true,
    canExportBulk: true,
    canUploadData: false,
    canManageUsers: false,
    canComputeIndex: false,
    canViewAdminPanel: false,
    maxExportRows: 50000,
    maxApiCallsPerMinute: 120,
    ownDataOnly: false,
  },
  CONTRIBUTOR: {
    role: 'CONTRIBUTOR',
    canViewAllData: true,
    canViewPremiumInsights: true,
    canExportBulk: true,
    canUploadData: true,
    canManageUsers: false,
    canComputeIndex: false,
    canViewAdminPanel: false,
    maxExportRows: 50000,
    maxApiCallsPerMinute: 120,
    ownDataOnly: false,
  },
  INSTITUTIONAL: {
    role: 'INSTITUTIONAL',
    canViewAllData: true,
    canViewPremiumInsights: true,
    canExportBulk: true,
    canUploadData: true,
    canManageUsers: false,
    canComputeIndex: false,
    canViewAdminPanel: false,
    maxExportRows: 999999,
    maxApiCallsPerMinute: 300,
    ownDataOnly: false,
  },
  ADMIN: {
    role: 'ADMIN',
    canViewAllData: true,
    canViewPremiumInsights: true,
    canExportBulk: true,
    canUploadData: true,
    canManageUsers: true,
    canComputeIndex: true,
    canViewAdminPanel: true,
    maxExportRows: 999999,
    maxApiCallsPerMinute: 1000,
    ownDataOnly: false,
  },
};

export function getPolicyForRole(role: string): DataAccessPolicy {
  return POLICIES[role] || POLICIES['PUBLIC'];
}

@Injectable()
export class RlsMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const user = (req as any).user;
    const role = user?.role || 'PUBLIC';
    (req as any).dataPolicy = getPolicyForRole(role);
    next();
  }
}
