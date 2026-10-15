import express from 'express';

export function createDownloadRoutes({ downloadController }) {
  const route = express.Router();

  route.get(
    '/download/:platform/:jobId/:file',
    downloadController.download
  );

  return route;
}
