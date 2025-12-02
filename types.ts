export interface DetectedPlate {
  plateNumber: string;
  vehicleType: string;
  region: string;
  confidence: number;
  color: string;
  box_2d?: number[]; // [ymin, xmin, ymax, xmax] 0-1000 scale
}

export interface ScanResult {
  id: string;
  timestamp: number;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  detections: DetectedPlate[];
  rawAnalysis?: string;
}

export interface AnalysisResponse {
  detections: {
    plate_number: string;
    vehicle_type: string;
    region_guess: string;
    confidence_score: number;
    vehicle_color: string;
    box_2d?: number[];
  }[];
}

export enum AppState {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}