import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../shared/types';
import { RoleName } from '../shared/constants';

/**
 * Builds an Express middleware that checks whether the authenticated user
 * has at least one of the allowed roles.  SUPER_ADMIN always passes.
 */
export function requireRoles(...roles: RoleName[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ detail: 'Authentication required.' });
      return;
    }

    const userRoles = user.roleNames;
    if (
      userRoles.includes(RoleName.SUPER_ADMIN) ||
      roles.some((r) => userRoles.includes(r))
    ) {
      next();
      return;
    }

    res.status(403).json({
      detail: 'You do not have permission to perform this action.',
    });
  };
}

/**
 * Verify that the requesting user is the owner of a resource OR has an
 * elevated role.  Pass a `getOwnerId` callback that returns the resource
 * owner's user ID from the request.
 */
export function requireOwnerOrRoles(
  getOwnerId: (req: Request) => number | undefined,
  ...elevatedRoles: RoleName[]
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ detail: 'Authentication required.' });
      return;
    }

    const userRoles = user.roleNames;
    if (userRoles.includes(RoleName.SUPER_ADMIN)) {
      next();
      return;
    }

    if (elevatedRoles.some((r) => userRoles.includes(r))) {
      next();
      return;
    }

    const ownerId = getOwnerId(req);
    if (ownerId !== undefined && ownerId === user.id) {
      next();
      return;
    }

    res.status(403).json({
      detail: 'You do not have permission to perform this action.',
    });
  };
}
