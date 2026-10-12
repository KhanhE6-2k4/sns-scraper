
import { Router } from 'express';

export function createGoogleServiceAccountRoutes({
  googleServiceAccountController,
}) {
  const router = Router();

  router.post(
    '/validate',
    googleServiceAccountController.validateSheet
  );

  router.post(
    '/export',
    googleServiceAccountController.exportResults
  );

  return router;
}
