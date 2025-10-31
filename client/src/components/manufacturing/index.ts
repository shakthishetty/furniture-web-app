// Manufacturing Tracking Shared UI Components
// Export all components for easy importing across the three-portal system

export { Timeline } from "./Timeline";
export { UpdateCard } from "./UpdateCard";
export { PhotoGrid } from "./PhotoGrid";
export { ReplyThread } from "./ReplyThread";
export { StageUpdateComposer } from "./StageUpdateComposer";
export { ProductCustomizationDetail } from "./ProductCustomizationDetail";

// Export hooks
export { useSSE, useManufacturingSSE, useManufacturerDashboardSSE } from "../../hooks/useSSE";

// Re-export types for convenience
export type {
  ManufacturingProcess,
  ManufacturingStage,
  StageUpdate,
  StageUpdatePhoto,
  StageUpdateReply
} from "@shared/schema";