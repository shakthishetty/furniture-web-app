import type { Response } from "express";

// SSE Connection interface
interface SSEConnection {
  response: Response;
  processId: string;
  orderId?: string;
  role: 'admin' | 'customer';
  userId?: string;
}

// SSE Update Data interfaces
interface StageUpdateData {
  type: 'stage_update';
  update: any;
}

interface NewReplyData {
  type: 'new_reply';
  reply: any;
}

interface ProcessStatusChangeData {
  type: 'process_status_change';
  processId: string;
  orderId?: string;
  status: string;
}

interface PhotoUploadData {
  type: 'photo_upload';
  photo: any;
}

interface StageSubmittedData {
  type: 'stage_submitted';
  stage: any;
}

interface StageApprovedData {
  type: 'stage_approved';
  stage: any;
}

interface StageRejectedData {
  type: 'stage_rejected';
  stage: any;
}

type SSEUpdateData = StageUpdateData | NewReplyData | ProcessStatusChangeData | PhotoUploadData | StageSubmittedData | StageApprovedData | StageRejectedData;

// Extend global namespace for SSE functionality
declare global {
  var sseConnections: Map<string, SSEConnection> | undefined;
  var broadcastManufacturingUpdate: ((processId: string, updateData: SSEUpdateData) => void) | undefined;
  var broadcastProcessStatusChange: ((processId: string, status: string, orderId?: string) => void) | undefined;
  var broadcastStageUpdate: ((processId: string, update: any) => void) | undefined;
  var broadcastNewReply: ((processId: string, reply: any) => void) | undefined;
  var broadcastPhotoUpload: ((processId: string, photo: any) => void) | undefined;
  var broadcastStageSubmitted: ((processId: string, stage: any) => void) | undefined;
  var broadcastStageApproved: ((processId: string, stage: any) => void) | undefined;
  var broadcastStageRejected: ((processId: string, stage: any) => void) | undefined;
}

export {};